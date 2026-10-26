package registrarcontrollers

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	dac "github.com/Snawoot/go-http-digest-auth-client"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func queueStudentSync(db *gorm.DB, devices []adminmodels.Devices, student registrarmodels.Student) error {
	for _, device := range devices {
		job := registrarmodels.DeviceSyncJob{
			StudentID: student.ID, DeviceID: device.ID, Status: "pending", Revision: 1, NextAttemptAt: time.Now(),
		}
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "student_id"}, {Name: "device_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"status": "pending", "attempts": 0, "next_attempt_at": job.NextAttemptAt,
				"synced_at": nil, "last_error": "", "updated_at": time.Now(), "revision": gorm.Expr("device_sync_jobs.revision + 1"),
			}),
		}).Create(&job).Error; err != nil {
			return err
		}
	}
	return nil
}

// QueueDeviceBackfill schedules all existing students when a device is added or changed.
func QueueDeviceBackfill(db *gorm.DB, device adminmodels.Devices) error {
	var students []registrarmodels.Student
	return db.Model(&registrarmodels.Student{}).FindInBatches(&students, 200, func(_ *gorm.DB, _ int) error {
		for _, student := range students {
			if err := queueStudentSync(db, []adminmodels.Devices{device}, student); err != nil {
				return err
			}
		}
		return nil
	}).Error
}

func sendStudentToDevice(ctx context.Context, device adminmodels.Devices, student registrarmodels.Student) error {
	client := &http.Client{
		Timeout:   5 * time.Second,
		Transport: dac.NewDigestTransport(os.Getenv("DEVICE_USERNAME"), os.Getenv("DEVICE_PASSWORD"), http.DefaultTransport),
	}
	address := device.IPAddress
	if device.Port > 0 && device.Port != 80 {
		address += ":" + strconv.Itoa(device.Port)
	}
	endpoint := (&url.URL{Scheme: "http", Host: address, Path: "/cgi-bin/AccessUser.cgi", RawQuery: "action=insertMulti"}).String()
	userType := 1
	if student.Status == registrarmodels.StatusActive {
		userType = 0
	}
	payload := map[string]interface{}{"UserList": []map[string]interface{}{{
		"UserID":   strconv.FormatUint(uint64(student.ID), 10),
		"UserName": fmt.Sprintf("%s %s %s", student.FirstName, student.FatherName, student.GrandFatherName),
		"UserType": userType, "UseTime": 1, "IsFirstEnter": true, "UserStatus": 0, "Authority": 2,
	}}}
	return (&digestDeviceClient{httpClient: client}).send(ctx, http.MethodPost, endpoint, payload)
}

func retryDelay(attempts int) time.Duration {
	if attempts > 6 {
		attempts = 6
	}
	return time.Minute * time.Duration(1<<uint(attempts-1))
}

// ProcessDeviceSyncJobs delivers pending records and persists per-device outcomes.
func ProcessDeviceSyncJobs(ctx context.Context, db *gorm.DB) error {
	var jobs []registrarmodels.DeviceSyncJob
	if err := db.Where("status IN ? AND next_attempt_at <= ?", []string{"pending", "failed"}, time.Now()).
		Order("next_attempt_at ASC").Limit(50).Find(&jobs).Error; err != nil {
		return err
	}
	for _, job := range jobs {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		var student registrarmodels.Student
		var device adminmodels.Devices
		err := db.First(&student, job.StudentID).Error
		if err == nil {
			err = db.First(&device, job.DeviceID).Error
		}
		if err == nil {
			err = sendStudentToDevice(ctx, device, student)
		}
		attempts := job.Attempts + 1
		updates := map[string]interface{}{"attempts": attempts}
		if err == nil {
			now := time.Now()
			updates["status"] = "succeeded"
			updates["synced_at"] = &now
			updates["last_error"] = ""
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			updates["status"] = "cancelled"
			updates["last_error"] = "student or device no longer exists"
		} else {
			updates["status"] = "failed"
			updates["next_attempt_at"] = time.Now().Add(retryDelay(attempts))
			updates["last_error"] = "device delivery failed"
			slog.Warn("device_sync_failed", "student_id", job.StudentID, "device_id", job.DeviceID, "attempt", attempts, "error", err)
		}
		if updateErr := db.Model(&job).Where("revision = ?", job.Revision).Updates(updates).Error; updateErr != nil {
			return updateErr
		}
	}
	return nil
}

func GetStudentSyncStatus(c *gin.Context, db *gorm.DB) {
	var jobs []registrarmodels.DeviceSyncJob
	if err := db.Where("student_id = ?", c.Param("id")).Order("device_id").Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load synchronization status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": jobs})
}

func RetryStudentSync(c *gin.Context, db *gorm.DB) {
	result := db.Model(&registrarmodels.DeviceSyncJob{}).Where("student_id = ? AND status IN ?", c.Param("id"), []string{"failed", "cancelled"}).
		Updates(map[string]interface{}{"status": "pending", "next_attempt_at": time.Now(), "last_error": ""})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retry synchronization"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"queued": result.RowsAffected})
}
