package registrarcontrollers

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"

	dac "github.com/Snawoot/go-http-digest-auth-client"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/SolomonAHailu/one-card-system/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SyncDataFromSMS fetches student data from an external SMS service and synchronizes it with the database.
func SyncDataFromSMS(c *gin.Context, db *gorm.DB) {
	username := os.Getenv("DEVICE_USERNAME")
	password := os.Getenv("DEVICE_PASSWORD")

	// Fetch student data from SMS service
	students, err := fetchStudentDataFromSMS()
	if err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Failed to fetch students from SMS", err)
		return
	}

	// Fetch all devices
	var devices []adminmodels.Devices
	if err := db.Find(&devices).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching devices", err)
		return
	}

	// Verify device statuses concurrently
	var wg sync.WaitGroup
	deviceErrors := make(chan error, len(devices))
	for _, device := range devices {
		wg.Add(1)
		go func(device adminmodels.Devices) {
			defer wg.Done()
			client := &http.Client{
				Transport: dac.NewDigestTransport(username, password, http.DefaultTransport),
			}
			apiURL := fmt.Sprintf("http://%s/cgi-bin/AccessUser.cgi?action=fetch", device.IPAddress)
			_, err := client.Get(apiURL)
			if err != nil {
				deviceErrors <- fmt.Errorf("device %s is offline: %v", device.IPAddress, err)
			}
		}(device)
	}
	wg.Wait()
	close(deviceErrors)

	// Handle device errors
	for err := range deviceErrors {
		slog.Error("device_check_failed", "error", err)
		utils.ResponseWithError(c, http.StatusInternalServerError, "Device status check failed", err)
		return
	}
	slog.Info("device_checks_complete", "devices", len(devices))

	// Synchronize student data
	for _, student := range students {
		var existingStudent registrarmodels.Student
		result := db.Where("student_id = ?", student.StudentID).First(&existingStudent)

		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				// New student, validate and insert
				if err := student.Validate(db); err != nil {
					slog.Error("student_validation_failed", "student_id", student.StudentID, "error", err)
					continue
				}
				if err := db.Create(&student).Error; err != nil {
					slog.Error("student_insert_failed", "student_id", student.StudentID, "error", err)
					continue
				}
				sendStudentToDevicesConcurrently(devices, student)
			} else {
				slog.Error("student_fetch_failed", "student_id", student.StudentID, "error", result.Error)
				continue
			}
		} else {
			// Existing student, check for updates
			if shouldUpdateStudent(existingStudent, student) {
				if err := student.ValidateForUpdate(db, existingStudent.ID); err != nil {
					slog.Error("student_validation_failed", "student_id", student.StudentID, "error", err)
					continue
				}
				if err := db.Model(&existingStudent).Updates(student).Error; err != nil {
					slog.Error("student_update_failed", "student_id", student.StudentID, "error", err)
					continue
				}
				sendStudentToDevicesConcurrently(devices, student)
			}
		}
	}
	slog.Info("student_sync_complete")
}
