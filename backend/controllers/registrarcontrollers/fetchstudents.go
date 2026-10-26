package registrarcontrollers

import (
	"errors"
	"fmt"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"gorm.io/gorm"
	"log/slog"
)

// SyncDataFromSMS fetches student data from an external SMS service and synchronizes it with the database.
func SyncDataFromSMS(db *gorm.DB) error {
	// Fetch student data from SMS service
	students, err := fetchStudentDataFromSMS()
	if err != nil {
		return fmt.Errorf("fetch students from source: %w", err)
	}

	// Fetch all devices
	var devices []adminmodels.Devices
	if err := db.Find(&devices).Error; err != nil {
		return fmt.Errorf("fetch devices for student sync: %w", err)
	}

	// Synchronize student data
	for _, student := range students {
		var existingStudent registrarmodels.Student
		result := db.Where("student_id = ?", student.StudentID).First(&existingStudent)

		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				// New student, validate and insert
				if err := student.Validate(db); err != nil {
					slog.Error("student_validation_failed", "student_id", student.StudentID, "error", err)
					continue
				}
				if err := db.Create(&student).Error; err != nil {
					slog.Error("student_insert_failed", "student_id", student.StudentID, "error", err)
					continue
				}
				if err := queueStudentSync(db, devices, student); err != nil {
					slog.Error("device_sync_queue_failed", "student_id", student.StudentID, "error", err)
				}
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
				student.ID = existingStudent.ID
				if err := queueStudentSync(db, devices, student); err != nil {
					slog.Error("device_sync_queue_failed", "student_id", student.StudentID, "error", err)
				}
			}
		}
	}
	slog.Info("student_sync_complete")
	return nil
}
