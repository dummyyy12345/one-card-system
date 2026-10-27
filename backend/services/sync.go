// sync_service.go
package services

import (
	"context"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/SolomonAHailu/one-card-system/controllers/accesscontrollers"
	"github.com/SolomonAHailu/one-card-system/controllers/registrarcontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/models/opsmodels"
	"gorm.io/gorm"
)

// StartSync initializes and starts the sync process
func StartSync() {
	for {
		if service := os.Getenv("SERVICE"); service != "" && service != "replace-with-sms-service-url" {
			if err := registrarcontrollers.SyncDataFromSMS(initializers.DB); err != nil {
				slog.Error("student_source_sync_failed", "error", err)
				now := time.Now().UTC()
				initializers.DB.Model(&opsmodels.SyncState{}).Where("key = ?", "student_source").Assign("last_failure_at", now).FirstOrCreate(&opsmodels.SyncState{Key: "student_source"})
			} else {
				now := time.Now().UTC()
				initializers.DB.Model(&opsmodels.SyncState{}).Where("key = ?", "student_source").Assign("last_success_at", now).FirstOrCreate(&opsmodels.SyncState{Key: "student_source"})
			}
		} else {
			slog.Info("student_source_sync_skipped", "reason", "SERVICE is not configured")
		}
		now := time.Now()
		sixPM := time.Date(now.Year(), now.Month(), now.Day(), 18, 0, 0, 0, now.Location())

		if now.After(sixPM) {
			sixPM = sixPM.Add(24 * time.Hour)
		}

		sleepDuration := sixPM.Sub(now)
		log.Printf("Next sync scheduled for: %s", sixPM)

		time.Sleep(sleepDuration)
	}
}

// StartDeviceSync retries queued deliveries without blocking student writes.
func StartDeviceSync(db *gorm.DB) {
	var lastPurge time.Time
	for {
		if err := registrarcontrollers.ProcessDeviceSyncJobs(context.Background(), db); err != nil {
			slog.Error("device_sync_worker_failed", "error", err)
		}
		if time.Since(lastPurge) >= time.Hour {
			if err := accesscontrollers.PurgeExpiredAudit(db, time.Now().UTC()); err != nil {
				slog.Error("audit_retention_failed", "error", err)
			} else {
				lastPurge = time.Now()
			}
		}
		time.Sleep(30 * time.Second)
	}
}
