//go:build integration

package registrarcontrollers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/SolomonAHailu/one-card-system/controllers/accesscontrollers"
	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/cafeteriamodels"
	"github.com/SolomonAHailu/one-card-system/models/dormitorymodels"
	"github.com/SolomonAHailu/one-card-system/models/librarymodels"
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
		&registrarmodels.Student{}, &registrarmodels.DeviceSyncJob{}, &accessmodels.AccessEvent{}); err != nil {
		t.Fatal(err)
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
}
