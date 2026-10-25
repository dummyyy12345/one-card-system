package registrarcontrollers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type fakeStudentUpdateStore struct {
	record     registrarmodels.Student
	deviceList []adminmodels.Devices
	devicesErr error
	studentErr error
	saveErr    error
	saved      *registrarmodels.Student
}

func (store *fakeStudentUpdateStore) devices(context.Context) ([]adminmodels.Devices, error) {
	return store.deviceList, store.devicesErr
}

func (store *fakeStudentUpdateStore) student(context.Context, string) (registrarmodels.Student, error) {
	return store.record, store.studentErr
}

func (store *fakeStudentUpdateStore) save(_ context.Context, student *registrarmodels.Student) error {
	copy := *student
	store.saved = &copy
	return store.saveErr
}

type fakeDeviceClient struct {
	checkErr error
	cardErr  error
	photoErr error
	checks   int
	cards    int
	photos   int
	previous string
	hadPhoto bool
}

func (client *fakeDeviceClient) Check(context.Context, adminmodels.Devices) error {
	client.checks++
	return client.checkErr
}

func (client *fakeDeviceClient) UpdateCard(_ context.Context, _ adminmodels.Devices, _ registrarmodels.Student, previous string) error {
	client.cards++
	client.previous = previous
	return client.cardErr
}

func (client *fakeDeviceClient) UpdatePhoto(_ context.Context, _ adminmodels.Devices, _ registrarmodels.Student, hadPhoto bool) error {
	client.photos++
	client.hadPhoto = hadPhoto
	return client.photoErr
}

func studentUpdateRequest(t *testing.T, body string) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPatch, "/students/7", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: "7"}}
	return c, recorder
}

func TestUpdateStudentCardNumberOffline(t *testing.T) {
	oldCard := "12345678"
	device := adminmodels.Devices{IPAddress: "unreachable-device"}
	for _, test := range []struct {
		name       string
		body       string
		checkErr   error
		cardErr    error
		wantStatus int
		wantSaved  bool
		wantCard   string
	}{
		{"updates card", `{"card_number":"87654321"}`, nil, nil, http.StatusOK, true, "87654321"},
		{"clears card", `{"card_number":""}`, nil, nil, http.StatusOK, true, ""},
		{"rejects invalid card", `{"card_number":"123"}`, nil, nil, http.StatusBadRequest, false, ""},
		{"rejects unavailable device", `{"card_number":"87654321"}`, errors.New("offline"), nil, http.StatusBadGateway, false, ""},
		{"reports failed sync", `{"card_number":"87654321"}`, nil, errors.New("offline"), http.StatusBadGateway, true, "87654321"},
	} {
		t.Run(test.name, func(t *testing.T) {
			store := &fakeStudentUpdateStore{
				record:     registrarmodels.Student{Model: gorm.Model{ID: 7}, CardNumber: &oldCard},
				deviceList: []adminmodels.Devices{device},
			}
			client := &fakeDeviceClient{checkErr: test.checkErr, cardErr: test.cardErr}
			c, recorder := studentUpdateRequest(t, test.body)
			updateStudentCardNumber(c, store, client)
			if recorder.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d: %s", recorder.Code, test.wantStatus, recorder.Body.String())
			}
			if (store.saved != nil) != test.wantSaved {
				t.Fatalf("saved = %v, want %v", store.saved != nil, test.wantSaved)
			}
			if store.saved != nil {
				got := ""
				if store.saved.CardNumber != nil {
					got = *store.saved.CardNumber
				}
				if got != test.wantCard || client.previous != oldCard || client.cards != 1 {
					t.Fatalf("saved card = %q, previous = %q, card calls = %d", got, client.previous, client.cards)
				}
			}
		})
	}
}

func TestUpdateStudentPhotoOffline(t *testing.T) {
	store := &fakeStudentUpdateStore{
		record:     registrarmodels.Student{Model: gorm.Model{ID: 7}},
		deviceList: []adminmodels.Devices{{IPAddress: "unreachable-device"}},
	}
	client := &fakeDeviceClient{}
	c, recorder := studentUpdateRequest(t, `{"photo":"base64-image"}`)
	updateStudentPhoto(c, store, client)
	if recorder.Code != http.StatusOK || store.saved == nil || store.saved.Photo == nil || *store.saved.Photo != "base64-image" {
		t.Fatalf("photo update failed: status=%d saved=%+v", recorder.Code, store.saved)
	}
	if client.checks != 1 || client.photos != 1 || client.hadPhoto {
		t.Fatalf("unexpected device calls: %+v", client)
	}

	store.saved = nil
	client.photoErr = errors.New("offline")
	c, recorder = studentUpdateRequest(t, `{"photo":"base64-image"}`)
	updateStudentPhoto(c, store, client)
	if recorder.Code != http.StatusBadGateway || store.saved == nil {
		t.Fatalf("sync failure should be visible after save: status=%d", recorder.Code)
	}
}

func TestUpdateStudentReturnsNotFoundWithoutHardware(t *testing.T) {
	store := &fakeStudentUpdateStore{studentErr: gorm.ErrRecordNotFound}
	client := &fakeDeviceClient{}
	c, recorder := studentUpdateRequest(t, `{"card_number":"87654321"}`)
	updateStudentCardNumber(c, store, client)
	if recorder.Code != http.StatusNotFound || client.checks != 0 {
		t.Fatalf("status=%d, device checks=%d", recorder.Code, client.checks)
	}
}
