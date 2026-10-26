// sync_service.go
package services

import (
	"context"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/SolomonAHailu/one-card-system/controllers/registrarcontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"gorm.io/gorm"
)

// StartSync initializes and starts the sync process
func StartSync() {
	for {
		if service := os.Getenv("SERVICE"); service != "" && service != "replace-with-sms-service-url" {
			if err := registrarcontrollers.SyncDataFromSMS(initializers.DB); err != nil {
				slog.Error("student_source_sync_failed", "error", err)
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
	for {
		if err := registrarcontrollers.ProcessDeviceSyncJobs(context.Background(), db); err != nil {
			slog.Error("device_sync_worker_failed", "error", err)
		}
		time.Sleep(30 * time.Second)
	}
}
