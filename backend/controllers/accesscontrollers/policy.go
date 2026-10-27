package accesscontrollers

import (
	"errors"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"gorm.io/gorm"
)

func loadPolicy(db *gorm.DB, location string) (accessmodels.AccessPolicy, error) {
	var policy accessmodels.AccessPolicy
	err := db.Where("location = ?", location).First(&policy).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return accessmodels.AccessPolicy{Location: location, Enabled: true, RequireAssignment: true, EndMinute: 1440, Weekdays: "1111111"}, nil
	}
	return policy, err
}

func assigned(student registrarmodels.Student, location string) bool {
	switch location {
	case "gate":
		return true
	case "cafeteria":
		return student.CafeteriaID != nil
	case "dormitory":
		return student.DormitoryID != nil
	case "library":
		return student.LibraryID != nil
	}
	return false
}

func evaluateStudent(db *gorm.DB, student registrarmodels.Student, policy accessmodels.AccessPolicy, now time.Time) (string, string, error) {
	if student.Status != registrarmodels.StatusActive {
		return "denied", "inactive_student", nil
	}
	if !policy.Enabled {
		return "denied", "location_closed", nil
	}
	minute := now.Hour()*60 + now.Minute()
	if len(policy.Weekdays) != 7 || policy.Weekdays[int(now.Weekday())] != '1' || minute < policy.StartMinute || minute >= policy.EndMinute {
		return "denied", "outside_hours", nil
	}
	if policy.RequireAssignment && !assigned(student, policy.Location) {
		var count int64
		if err := db.Model(&accessmodels.AccessException{}).Where("student_id = ? AND location = ? AND expires_at > ?", student.ID, policy.Location, now).Count(&count).Error; err != nil {
			return "", "", err
		}
		if count == 0 {
			return "denied", "not_assigned", nil
		}
		return "allowed", "temporary_exception", nil
	}
	return "allowed", "eligible", nil
}
