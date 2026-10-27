//go:build integration

package registrarcontrollers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/SolomonAHailu/one-card-system/controllers/accesscontrollers"
	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/cafeteriamodels"
	"github.com/SolomonAHailu/one-card-system/models/dormitorymodels"
	"github.com/SolomonAHailu/one-card-system/models/librarymodels"
	"github.com/SolomonAHailu/one-card-system/models/opsmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestPostgresAccessDecisionsAndDeviceQueue(t *testing.T) {
	dsn := os.Getenv("INTEGRATION_DB_DSN")
	if dsn == "" {
		t.Fatal("INTEGRATION_DB_DSN is required for integration tests")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&adminmodels.Roles{}, &adminmodels.Users{}, &adminmodels.Devices{},
		&cafeteriamodels.Cafeterias{}, &dormitorymodels.Dormitories{}, &librarymodels.Libraries{},
		&registrarmodels.Student{}, &registrarmodels.DeviceSyncJob{}, &accessmodels.AccessEvent{},
		&accessmodels.AccessPolicy{}, &accessmodels.AccessPolicyRevision{}, &accessmodels.AccessException{},
		&accessmodels.StudentViewAudit{}, &opsmodels.SyncState{}); err != nil {
		t.Fatal(err)
	}
	metrics := middlewares.NewRequestMetrics()
	metrics.AttachDatabase(db)
	metricsResponse := httptest.NewRecorder()
	metrics.Handler().ServeHTTP(metricsResponse, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if metricsResponse.Code != http.StatusOK || !strings.Contains(metricsResponse.Body.String(), "onecard_device_sync_jobs") {
		t.Fatalf("operational metrics unavailable: %d", metricsResponse.Code)
	}
	tx := db.Begin()
	defer tx.Rollback()
	t.Setenv("API_SECRET", "integration-test-secret")
	role := adminmodels.Roles{RoleName: "Gate", Description: "Gate staff"}
	card := "integration-card-123"
	student := registrarmodels.Student{
		StudentID: "INTEGRATION-1", CardNumber: &card, FirstName: "Ada", FatherName: "Example",
		GrandFatherName: "Test", Email: "integration@example.invalid", Phone: "0982010311",
		Sex: registrarmodels.SexFemale, DateOfBirth: time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),
		Program: "Testing", Section: "A", Year: 1, Semester: 1,
		RegisteredDate: time.Now(), Status: registrarmodels.StatusActive,
	}
	device := adminmodels.Devices{SerialNumber: "integration-device", Name: "Test device", IPAddress: "127.0.0.1", Port: 80, Location: "gate"}
	for _, item := range []interface{}{&role, &student, &device} {
		if err := tx.Create(item).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err := QueueDeviceBackfill(tx, device); err != nil {
		t.Fatal(err)
	}
	var job registrarmodels.DeviceSyncJob
	if err := tx.Where("student_id = ? AND device_id = ?", student.ID, device.ID).First(&job).Error; err != nil || job.Status != "pending" {
		t.Fatalf("queued job = %+v, error = %v", job, err)
	}
	if err := queueStudentSync(tx, []adminmodels.Devices{device}, student); err != nil {
		t.Fatal(err)
	}
	var jobs int64
	if err := tx.Model(&registrarmodels.DeviceSyncJob{}).Where("student_id = ?", student.ID).Count(&jobs).Error; err != nil || jobs != 1 {
		t.Fatalf("duplicate queue entries = %d, error = %v", jobs, err)
	}
	if err := tx.First(&job, job.ID).Error; err != nil || job.Revision != 2 {
		t.Fatalf("requeued job revision = %d, error = %v", job.Revision, err)
	}
	gin.SetMode(gin.TestMode)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/access/check", strings.NewReader(`{"card_number":"integration-card-123","location":"gate","station":"North"}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(response)
	c.Request = request
	c.Set("userRole", int(role.ID))
	c.Set("userId", uint(7))
	accesscontrollers.CheckCard(c, tx)
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"decision":"allowed"`) {
		t.Fatalf("access response: %d %s", response.Code, response.Body.String())
	}
	var count int64
	if err := tx.Model(&accessmodels.AccessEvent{}).Where("student_id = ? AND decision = ?", student.ID, "allowed").Count(&count).Error; err != nil || count != 1 {
		t.Fatalf("stored access events = %d, error = %v", count, err)
	}
	var recorded accessmodels.AccessEvent
	if err := tx.Where("student_id = ? AND decision = ?", student.ID, "allowed").First(&recorded).Error; err != nil || recorded.ActorID != 7 {
		t.Fatalf("recorded actor = %d, error = %v", recorded.ActorID, err)
	}
	unknownRequest := httptest.NewRequest(http.MethodPost, "/api/v1/access/check", strings.NewReader(`{"card_number":"unknown-card","location":"gate","station":"North"}`))
	unknownRequest.Header.Set("Content-Type", "application/json")
	unknownResponse := httptest.NewRecorder()
	unknownContext, _ := gin.CreateTestContext(unknownResponse)
	unknownContext.Request = unknownRequest
	unknownContext.Set("userRole", int(role.ID))
	unknownContext.Set("userId", uint(7))
	accesscontrollers.CheckCard(unknownContext, tx)
	if unknownResponse.Code != http.StatusOK || !strings.Contains(unknownResponse.Body.String(), `"reason":"unknown_card"`) {
		t.Fatalf("unknown card response: %d %s", unknownResponse.Code, unknownResponse.Body.String())
	}
	if err := tx.Model(&accessmodels.AccessEvent{}).Where("decision = ?", "denied").Count(&count).Error; err != nil || count != 1 {
		t.Fatalf("denied events = %d, error = %v", count, err)
	}

	// A signed reader event is idempotent even when the reader retries after a timeout.
	t.Setenv("READER_HMAC_KEYS", `{"integration-device":"reader-secret-at-least-thirty-two-bytes"}`)
	readerBody := `{"event_id":"integration-event-001","reader_id":"integration-device","card_number":"integration-card-123","location":"gate","station":"North reader"}`
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	mac := hmac.New(sha256.New, []byte("reader-secret-at-least-thirty-two-bytes"))
	mac.Write([]byte(timestamp + "\n" + readerBody))
	signature := hex.EncodeToString(mac.Sum(nil))
	for i := 0; i < 2; i++ {
		request := httptest.NewRequest(http.MethodPost, "/api/v1/access/reader-events", strings.NewReader(readerBody))
		request.Header.Set("X-Reader-Timestamp", timestamp)
		request.Header.Set("X-Reader-Signature", signature)
		recorder := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(recorder)
		ctx.Request = request
		accesscontrollers.ReceiveReaderEvent(ctx, tx)
		if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), `"decision":"allowed"`) {
			t.Fatalf("reader response: %d %s", recorder.Code, recorder.Body.String())
		}
	}
	if err := tx.Model(&accessmodels.AccessEvent{}).Where("reader_event_id = ?", "integration-event-001").Count(&count).Error; err != nil || count != 1 {
		t.Fatalf("reader event duplicates = %d, error = %v", count, err)
	}
	readerEventID := "integration-event-001"
	if _, _, err := accesscontrollers.StoreAccessDecision(tx, accesscontrollers.CardCheckInput{CardNumber: card, Location: "gate", Station: "Other"}, 0, "other-reader", &readerEventID); !errors.Is(err, accesscontrollers.ErrReaderEventCollision) {
		t.Fatalf("cross-reader event ID collision was accepted: %v", err)
	}

	policyBody := `{"enabled":false,"require_assignment":true,"start_minute":0,"end_minute":1440,"weekdays":"1111111"}`
	policyRequest := httptest.NewRequest(http.MethodPut, "/api/v1/admin/access/policies/gate", strings.NewReader(policyBody))
	policyRequest.Header.Set("Content-Type", "application/json")
	policyResponse := httptest.NewRecorder()
	policyContext, _ := gin.CreateTestContext(policyResponse)
	policyContext.Request = policyRequest
	policyContext.Params = gin.Params{{Key: "location", Value: "gate"}}
	policyContext.Set("userId", uint(7))
	accesscontrollers.SavePolicy(policyContext, tx)
	if policyResponse.Code != http.StatusOK {
		t.Fatalf("policy response: %d %s", policyResponse.Code, policyResponse.Body.String())
	}
	closedRequest := httptest.NewRequest(http.MethodPost, "/api/v1/access/check", strings.NewReader(`{"card_number":"integration-card-123","location":"gate","station":"North"}`))
	closedRequest.Header.Set("Content-Type", "application/json")
	closedResponse := httptest.NewRecorder()
	closedContext, _ := gin.CreateTestContext(closedResponse)
	closedContext.Request = closedRequest
	closedContext.Set("userRole", int(role.ID))
	closedContext.Set("userId", uint(7))
	accesscontrollers.CheckCard(closedContext, tx)
	if closedResponse.Code != http.StatusOK || !strings.Contains(closedResponse.Body.String(), `"reason":"location_closed"`) {
		t.Fatalf("closed policy decision: %d %s", closedResponse.Code, closedResponse.Body.String())
	}
	var revision accessmodels.AccessPolicyRevision
	if err := tx.Where("location = ? AND version = ?", "gate", 1).First(&revision).Error; err != nil || revision.Enabled {
		t.Fatalf("policy revision not stored: %+v, %v", revision, err)
	}

	var operations []string
	deviceServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		operations = append(operations, r.Method+" "+r.URL.Path+"?"+r.URL.Query().Get("action"))
		w.WriteHeader(http.StatusOK)
	}))
	defer deviceServer.Close()
	host, portText, err := net.SplitHostPort(deviceServer.Listener.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	port, _ := strconv.Atoi(portText)
	if err := tx.Model(&device).Updates(map[string]interface{}{"ip_address": host, "port": port}).Error; err != nil {
		t.Fatal(err)
	}
	device.IPAddress, device.Port = host, port
	if err := queueMediaSync(tx, []adminmodels.Devices{device}, student, "card", "old-card-one", false); err != nil {
		t.Fatal(err)
	}
	if err := queueMediaSync(tx, []adminmodels.Devices{device}, student, "card", "old-card-two", false); err != nil {
		t.Fatal(err)
	}
	if err := tx.First(&job, job.ID).Error; err != nil {
		t.Fatal(err)
	}
	var removals []string
	if err := json.Unmarshal([]byte(job.CardRemovals), &removals); err != nil || len(removals) != 2 {
		t.Fatalf("pending card removals = %v, error = %v", removals, err)
	}
	if err := ProcessDeviceSyncJobs(context.Background(), tx); err != nil {
		t.Fatal(err)
	}
	if err := tx.First(&job, job.ID).Error; err != nil || job.Status != "succeeded" || job.SyncCard || len(operations) != 4 {
		t.Fatalf("delivery = %+v operations = %v error = %v", job, operations, err)
	}
	if err := ProcessDeviceSyncJobs(context.Background(), tx); err != nil {
		t.Fatal(err)
	}
	if len(operations) != 4 {
		t.Fatalf("succeeded job delivered twice: %v", operations)
	}

	// Retention is disabled by default, then removes only records older than the configured period.
	old := time.Now().Add(-48 * time.Hour)
	oldEvent := accessmodels.AccessEvent{CreatedAt: old, CardFingerprint: strings.Repeat("a", 64), Location: "gate", Station: "Retention test", Decision: "denied", Reason: "test"}
	if err := tx.Create(&oldEvent).Error; err != nil {
		t.Fatal(err)
	}
	t.Setenv("ACCESS_EVENT_RETENTION_DAYS", "0")
	if err := accesscontrollers.PurgeExpiredAudit(tx, time.Now()); err != nil {
		t.Fatal(err)
	}
	if err := tx.First(&oldEvent, oldEvent.ID).Error; err != nil {
		t.Fatalf("disabled retention deleted an event: %v", err)
	}
	t.Setenv("ACCESS_EVENT_RETENTION_DAYS", "999999999")
	if err := accesscontrollers.PurgeExpiredAudit(tx, time.Now()); err != nil {
		t.Fatal(err)
	}
	if err := tx.First(&oldEvent, oldEvent.ID).Error; err != nil {
		t.Fatalf("invalid retention deleted an event: %v", err)
	}
	t.Setenv("ACCESS_EVENT_RETENTION_DAYS", "1")
	if err := accesscontrollers.PurgeExpiredAudit(tx, time.Now()); err != nil {
		t.Fatal(err)
	}
	if err := tx.Model(&accessmodels.AccessEvent{}).Where("id = ?", oldEvent.ID).Count(&count).Error; err != nil || count != 0 {
		t.Fatalf("old event retained: count=%d error=%v", count, err)
	}

	ownerUser := adminmodels.Users{FirstName: "Owner", FatherName: "Example", GrandFatherName: "Test", Email: "owner-integration@example.invalid", RoleId: int(role.ID)}
	if err := tx.Create(&ownerUser).Error; err != nil {
		t.Fatal(err)
	}
	owner := int(ownerUser.ID)
	if err := tx.Model(&student).Update("registered_by_id", owner).Error; err != nil {
		t.Fatal(err)
	}
	student.RegisteredByID = &owner
	viewRequest := httptest.NewRequest(http.MethodGet, "/api/v1/registrar/student/1", nil)
	deniedView := httptest.NewRecorder()
	deniedContext, _ := gin.CreateTestContext(deniedView)
	deniedContext.Request = viewRequest
	deniedContext.Params = gin.Params{{Key: "id", Value: strconv.FormatUint(uint64(student.ID), 10)}}
	deniedContext.Set("userId", uint(owner+1))
	GetStudentById(deniedContext, tx)
	if deniedView.Code != http.StatusForbidden {
		t.Fatalf("other registrar view status = %d", deniedView.Code)
	}
	allowedView := httptest.NewRecorder()
	allowedContext, _ := gin.CreateTestContext(allowedView)
	allowedContext.Request = viewRequest
	allowedContext.Params = deniedContext.Params
	allowedContext.Set("userId", uint(owner))
	GetStudentById(allowedContext, tx)
	if allowedView.Code != http.StatusOK {
		t.Fatalf("owner view status = %d: %s", allowedView.Code, allowedView.Body.String())
	}
	if err := tx.Model(&accessmodels.StudentViewAudit{}).Where("student_id = ? AND actor_id = ?", student.ID, owner).Count(&count).Error; err != nil || count != 1 {
		t.Fatalf("detail view audit: count=%d error=%v", count, err)
	}
}

func TestPostgresWorkersClaimOneDeliveryAndHandoffNewRevision(t *testing.T) {
	dsn := os.Getenv("INTEGRATION_DB_DSN")
	if dsn == "" {
		t.Fatal("INTEGRATION_DB_DSN is required")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&adminmodels.Roles{}, &adminmodels.Users{}, &adminmodels.Devices{},
		&cafeteriamodels.Cafeterias{}, &dormitorymodels.Dormitories{}, &librarymodels.Libraries{},
		&registrarmodels.Student{}, &registrarmodels.DeviceSyncJob{}); err != nil {
		t.Fatal(err)
	}
	var calls atomic.Int64
	var pause atomic.Bool
	started := make(chan struct{}, 1)
	release := make(chan struct{})
	deviceServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls.Add(1)
		if pause.Load() {
			select {
			case started <- struct{}{}:
			default:
			}
			<-release
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer deviceServer.Close()
	host, portText, err := net.SplitHostPort(deviceServer.Listener.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	port, _ := strconv.Atoi(portText)
	suffix := strconv.FormatInt(time.Now().UnixNano(), 10)
	student := registrarmodels.Student{StudentID: "CLAIM-" + suffix, FirstName: "Ada", FatherName: "Example", GrandFatherName: "Test", Email: "claim-" + suffix + "@example.invalid", Phone: "0982010311", Sex: registrarmodels.SexFemale, DateOfBirth: time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC), Program: "Testing", Section: "A", Year: 1, Semester: 1, RegisteredDate: time.Now(), Status: registrarmodels.StatusActive}
	device := adminmodels.Devices{SerialNumber: "claim-" + suffix, Name: "Claim test", IPAddress: host, Port: port, Location: "gate"}
	if err := db.Create(&student).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&device).Error; err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		db.Unscoped().Where("student_id = ?", student.ID).Delete(&registrarmodels.DeviceSyncJob{})
		db.Unscoped().Delete(&student)
		db.Unscoped().Delete(&device)
	})
	if err := queueStudentSync(db, []adminmodels.Devices{device}, student); err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	errors := make(chan error, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); errors <- ProcessDeviceSyncJobs(context.Background(), db) }()
	}
	wg.Wait()
	close(errors)
	for err := range errors {
		if err != nil {
			t.Fatal(err)
		}
	}
	if calls.Load() != 1 {
		t.Fatalf("two workers sent %d copies", calls.Load())
	}

	// Requeue while the first worker is waiting for a device response. The
	// newer revision must remain behind its lease and run after that worker.
	if err := queueStudentSync(db, []adminmodels.Devices{device}, student); err != nil {
		t.Fatal(err)
	}
	pause.Store(true)
	finished := make(chan error, 1)
	go func() { finished <- ProcessDeviceSyncJobs(context.Background(), db) }()
	select {
	case <-started:
	case <-time.After(10 * time.Second):
		t.Fatal("worker did not reach device")
	}
	if err := queueStudentSync(db, []adminmodels.Devices{device}, student); err != nil {
		t.Fatal(err)
	}
	if err := ProcessDeviceSyncJobs(context.Background(), db); err != nil {
		t.Fatal(err)
	}
	if calls.Load() != 2 {
		t.Fatalf("new revision overlapped active worker: %d calls", calls.Load())
	}
	pause.Store(false)
	close(release)
	if err := <-finished; err != nil {
		t.Fatal(err)
	}
	if err := ProcessDeviceSyncJobs(context.Background(), db); err != nil {
		t.Fatal(err)
	}
	if calls.Load() != 3 {
		t.Fatalf("new revision not delivered exactly once: %d calls", calls.Load())
	}
	var job registrarmodels.DeviceSyncJob
	if err := db.Where("student_id = ? AND device_id = ?", student.ID, device.ID).First(&job).Error; err != nil || job.Status != "succeeded" {
		t.Fatal(fmt.Sprintf("final job status %q, error %v", job.Status, err))
	}
}
