package registrarcontrollers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	dac "github.com/Snawoot/go-http-digest-auth-client"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

func sendStudentToDevice(device adminmodels.Devices, student registrarmodels.Student) {
	username := os.Getenv("DEVICE_USERNAME")
	password := os.Getenv("DEVICE_PASSWORD")
	client := &http.Client{
		Transport: dac.NewDigestTransport(username, password, http.DefaultTransport),
	}
	apiURL := fmt.Sprintf("http://%s/cgi-bin/AccessUser.cgi?action=insertMulti", device.IPAddress)
	userData := map[string]interface{}{
		"UserID":   fmt.Sprintf("%d", student.ID),
		"UserName": fmt.Sprintf("%s %s %s", student.FirstName, student.FatherName, student.GrandFatherName),
		"UserType": func() int {
			if student.Status == registrarmodels.StatusActive {
				return 0
			}
			return 1
		}(),
		"UseTime":      1,
		"IsFirstEnter": true,
		"UserStatus":   0,
		"Authority":    2,
	}
	payload := map[string]interface{}{
		"UserList": []map[string]interface{}{userData},
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		slog.Error("device_payload_encode_failed", "error", err)
		return
	}
	resp, err := client.Post(apiURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		slog.Error("device_student_sync_failed", "error", err)
		return
	}
	defer resp.Body.Close()
}

// sendStudentToDevicesConcurrently sends student data to all devices concurrently.
func sendStudentToDevicesConcurrently(devices []adminmodels.Devices, student registrarmodels.Student) {
	var wg sync.WaitGroup
	for _, device := range devices {
		wg.Add(1)
		go func(device adminmodels.Devices) {
			defer wg.Done()
			sendStudentToDevice(device, student)
		}(device)
	}
	wg.Wait()
}

// shouldUpdateStudent compares two Student records and returns true if there are any differences.
func shouldUpdateStudent(existing, new registrarmodels.Student) bool {
	return existing.FirstName != new.FirstName ||
		existing.FatherName != new.FatherName ||
		existing.GrandFatherName != new.GrandFatherName ||
		existing.Email != new.Email ||
		existing.Phone != new.Phone ||
		existing.Sex != new.Sex ||
		!existing.DateOfBirth.Equal(new.DateOfBirth) ||
		existing.Program != new.Program ||
		existing.Section != new.Section ||
		existing.Year != new.Year ||
		existing.Semester != new.Semester ||
		existing.Religion != new.Religion ||
		existing.Status != new.Status
}

// parseDate parses a date string and returns a time.Time object.
func parseDate(dateStr string) time.Time {
	const layout = "2006-01-02"
	parsedDate, _ := time.Parse(layout, dateStr)
	return parsedDate
}

