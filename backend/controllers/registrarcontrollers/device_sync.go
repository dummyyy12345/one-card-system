package registrarcontrollers

import (
	"context"
	"encoding/json"
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
			SyncCard: true, SyncPhoto: student.Photo != nil, CardRemovals: "[]",
		}
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "student_id"}, {Name: "device_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"status": gorm.Expr("CASE WHEN device_sync_jobs.status = 'processing' THEN 'processing' ELSE 'pending' END"), "attempts": 0, "next_attempt_at": job.NextAttemptAt,
				"synced_at": nil, "last_error": "", "updated_at": time.Now(), "revision": gorm.Expr("device_sync_jobs.revision + 1"),
				"sync_card": true, "sync_photo": student.Photo != nil,
			}),
		}).Create(&job).Error; err != nil {
			return err
		}
	}
	return nil
}

// queueMediaSync is called inside the same transaction as the student update.
// Old card numbers remain queued until the device confirms their removal.
func queueMediaSync(tx *gorm.DB, devices []adminmodels.Devices, student registrarmodels.Student, kind, previous string, hadPhoto bool) error {
	for _, device := range devices {
		var job registrarmodels.DeviceSyncJob
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("student_id = ? AND device_id = ?", student.ID, device.ID).First(&job).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			job = registrarmodels.DeviceSyncJob{StudentID: student.ID, DeviceID: device.ID, Revision: 1, CardRemovals: "[]"}
		} else {
			job.Revision++
		}
		if kind == "card" {
			job.SyncCard = true
			var old []string
			if job.CardRemovals == "" {
				job.CardRemovals = "[]"
			}
			if err := json.Unmarshal([]byte(job.CardRemovals), &old); err != nil {
				return fmt.Errorf("decode pending card removals: %w", err)
			}
			if previous != "" {
				found := false
				for _, card := range old {
					found = found || card == previous
				}
				if !found {
					old = append(old, previous)
				}
			}
			encoded, _ := json.Marshal(old)
			job.CardRemovals = string(encoded)
		} else if kind == "photo" {
			job.SyncPhoto = true
			job.HadPhoto = hadPhoto || job.HadPhoto
		}
		if job.Status != "processing" {
			job.Status = "pending"
			job.LeaseUntil = nil
		}
		job.Attempts, job.NextAttemptAt = 0, time.Now()
		job.SyncedAt, job.LastError = nil, ""
		if err := tx.Save(&job).Error; err != nil {
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
	if err := db.Where("(status IN ? AND next_attempt_at <= ?) OR (status = ? AND lease_until <= ?)", []string{"pending", "failed"}, time.Now(), "processing", time.Now()).
		Order("next_attempt_at ASC").Limit(50).Find(&jobs).Error; err != nil {
		return err
	}
	for _, job := range jobs {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		lease := time.Now().Add(2 * time.Minute)
		claim := db.Model(&registrarmodels.DeviceSyncJob{}).Where("id = ? AND revision = ? AND ((status IN ? AND next_attempt_at <= ?) OR (status = ? AND lease_until <= ?))", job.ID, job.Revision, []string{"pending", "failed"}, time.Now(), "processing", time.Now()).
			Updates(map[string]interface{}{"status": "processing", "lease_until": lease})
		if claim.Error != nil {
			return claim.Error
		}
		if claim.RowsAffected == 0 {
			continue
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
		if err == nil && job.SyncCard {
			var removals []string
			if err = json.Unmarshal([]byte(job.CardRemovals), &removals); err == nil {
				err = syncCardsToDevice(ctx, device, student, removals)
			}
		}
		if err == nil && job.SyncPhoto && student.Photo != nil {
			err = newDigestDeviceClient().UpdatePhoto(ctx, device, student, job.HadPhoto)
		}
		attempts := job.Attempts + 1
		updates := map[string]interface{}{"attempts": attempts}
		if err == nil {
			now := time.Now()
			updates["status"] = "succeeded"
			updates["synced_at"] = &now
			updates["last_error"] = ""
			updates["sync_card"] = false
			updates["sync_photo"] = false
			updates["card_removals"] = "[]"
			updates["had_photo"] = false
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			updates["status"] = "cancelled"
			updates["last_error"] = "student or device no longer exists"
		} else {
			updates["status"] = "failed"
			updates["next_attempt_at"] = time.Now().Add(retryDelay(attempts))
			updates["last_error"] = "device delivery failed"
			slog.Warn("device_sync_failed", "student_id", job.StudentID, "device_id", job.DeviceID, "attempt", attempts, "error", err)
		}
		updates["lease_until"] = nil
		completion := db.Model(&job).Where("revision = ? AND status = ? AND lease_until = ?", job.Revision, "processing", lease).Updates(updates)
		if completion.Error != nil {
			return completion.Error
		}
		if completion.RowsAffected == 0 {
			// A newer desired state was queued while this worker was delivering.
			// Release it only if this worker still owns the lease.
			release := db.Model(&job).Where("revision > ? AND status = ? AND lease_until = ?", job.Revision, "processing", lease).
				Updates(map[string]interface{}{"status": "pending", "lease_until": nil, "next_attempt_at": time.Now()})
			if release.Error != nil {
				return release.Error
			}
		}
	}
	return nil
}

func GetStudentSyncStatus(c *gin.Context, db *gorm.DB) {
	if !requireStudentScope(c, db, c.Param("id")) {
		return
	}
	var jobs []registrarmodels.DeviceSyncJob
	if err := db.Where("student_id = ?", c.Param("id")).Order("device_id").Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load synchronization status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": jobs})
}

func RetryStudentSync(c *gin.Context, db *gorm.DB) {
	if !requireStudentScope(c, db, c.Param("id")) {
		return
	}
	result := db.Model(&registrarmodels.DeviceSyncJob{}).Where("student_id = ? AND status IN ?", c.Param("id"), []string{"failed", "cancelled"}).
		Updates(map[string]interface{}{"status": "pending", "next_attempt_at": time.Now(), "last_error": ""})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retry synchronization"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"queued": result.RowsAffected})
}
