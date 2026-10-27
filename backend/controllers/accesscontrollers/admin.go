package accesscontrollers

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/opsmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var weekdaysPattern = regexp.MustCompile(`^[01]{7}$`)

func ListPolicies(c *gin.Context, db *gorm.DB) {
	policies := make([]accessmodels.AccessPolicy, 0, 4)
	for _, location := range []string{"gate", "cafeteria", "dormitory", "library"} {
		policy, err := loadPolicy(db, location)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load policies"})
			return
		}
		policies = append(policies, policy)
	}
	c.JSON(http.StatusOK, gin.H{"data": policies})
}

func SavePolicy(c *gin.Context, db *gorm.DB) {
	location := c.Param("location")
	if !validLocation(location) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location"})
		return
	}
	var input struct {
		Enabled           *bool  `json:"enabled"`
		RequireAssignment *bool  `json:"require_assignment"`
		StartMinute       *int   `json:"start_minute"`
		EndMinute         *int   `json:"end_minute"`
		Weekdays          string `json:"weekdays"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || input.Enabled == nil || input.RequireAssignment == nil || input.StartMinute == nil || input.EndMinute == nil || *input.StartMinute < 0 || *input.EndMinute > 1440 || *input.StartMinute >= *input.EndMinute || !weekdaysPattern.MatchString(input.Weekdays) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid policy"})
		return
	}
	var policy accessmodels.AccessPolicy
	err := db.Transaction(func(tx *gorm.DB) error {
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("location = ?", location).First(&policy).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			policy.Location, policy.Version = location, 1
		} else {
			policy.Version++
		}
		policy.Enabled, policy.RequireAssignment = *input.Enabled, *input.RequireAssignment
		policy.StartMinute, policy.EndMinute, policy.Weekdays = *input.StartMinute, *input.EndMinute, input.Weekdays
		policy.UpdatedBy = c.GetUint("userId")
		if err := tx.Save(&policy).Error; err != nil {
			return err
		}
		return tx.Create(&accessmodels.AccessPolicyRevision{Location: location, Version: policy.Version, Enabled: policy.Enabled, RequireAssignment: policy.RequireAssignment, StartMinute: policy.StartMinute, EndMinute: policy.EndMinute, Weekdays: policy.Weekdays, UpdatedBy: policy.UpdatedBy}).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save policy"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": policy})
}

func ListPolicyRevisions(c *gin.Context, db *gorm.DB) {
	if !validLocation(c.Param("location")) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location"})
		return
	}
	var revisions []accessmodels.AccessPolicyRevision
	if err := db.Where("location = ?", c.Param("location")).Order("version DESC").Limit(100).Find(&revisions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load policy history"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": revisions})
}

func CreateException(c *gin.Context, db *gorm.DB) {
	var input struct {
		StudentID uint      `json:"student_id"`
		Location  string    `json:"location"`
		ExpiresAt time.Time `json:"expires_at"`
		Reason    string    `json:"reason"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || input.StudentID == 0 || !validLocation(input.Location) || input.ExpiresAt.Before(time.Now().Add(time.Minute)) || input.ExpiresAt.After(time.Now().Add(30*24*time.Hour)) || len(strings.TrimSpace(input.Reason)) < 5 || len(input.Reason) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exception"})
		return
	}
	if err := db.First(&registrarmodels.Student{}, input.StudentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	exception := accessmodels.AccessException{StudentID: input.StudentID, Location: input.Location, ExpiresAt: input.ExpiresAt.UTC(), Reason: strings.TrimSpace(input.Reason), CreatedBy: c.GetUint("userId")}
	if err := db.Create(&exception).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create exception"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": exception})
}

func ListExceptions(c *gin.Context, db *gorm.DB) {
	query := db.Where("expires_at > ?", time.Now())
	if value := c.Query("student_id"); value != "" {
		id, err := strconv.ParseUint(value, 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
			return
		}
		query = query.Where("student_id = ?", id)
	}
	var exceptions []accessmodels.AccessException
	if err := query.Order("expires_at ASC").Limit(100).Find(&exceptions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load exceptions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": exceptions})
}

func DeleteException(c *gin.Context, db *gorm.DB) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exception ID"})
		return
	}
	result := db.Delete(&accessmodels.AccessException{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to revoke exception"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exception not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

func ListStudentViews(c *gin.Context, db *gorm.DB) {
	var views []accessmodels.StudentViewAudit
	if err := db.Order("viewed_at DESC").Limit(100).Find(&views).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load audit trail"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": views})
}

func Operations(c *gin.Context, db *gorm.DB) {
	var jobs []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	if err := db.Model(&registrarmodels.DeviceSyncJob{}).Select("status, count(*) AS count").Group("status").Scan(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load operations"})
		return
	}
	var state opsmodels.SyncState
	if err := db.First(&state, "key = ?", "student_source").Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load source sync status"})
		return
	}
	var devices []adminmodels.Devices
	if err := db.Find(&devices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load device status"})
		return
	}
	var studentCount int64
	if err := db.Model(&registrarmodels.Student{}).Count(&studentCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to count students"})
		return
	}
	type deviceStatus struct {
		DeviceID        uint       `json:"device_id"`
		Name            string     `json:"name"`
		Location        string     `json:"location"`
		OutOfSync       int64      `json:"out_of_sync"`
		MissingJobs     int64      `json:"missing_jobs"`
		LastConfirmedAt *time.Time `json:"last_confirmed_at"`
	}
	statuses := make([]deviceStatus, 0, len(devices))
	for _, device := range devices {
		var tracked, outOfSync int64
		if err := db.Model(&registrarmodels.DeviceSyncJob{}).Where("device_id = ?", device.ID).Count(&tracked).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to count device jobs"})
			return
		}
		if err := db.Model(&registrarmodels.DeviceSyncJob{}).Where("device_id = ? AND status <> ?", device.ID, "succeeded").Count(&outOfSync).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to count device jobs"})
			return
		}
		var last struct {
			SyncedAt *time.Time `json:"synced_at"`
		}
		if err := db.Model(&registrarmodels.DeviceSyncJob{}).Select("max(synced_at) AS synced_at").Where("device_id = ?", device.ID).Scan(&last).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load last delivery"})
			return
		}
		missing := studentCount - tracked
		if missing < 0 {
			missing = 0
		}
		statuses = append(statuses, deviceStatus{DeviceID: device.ID, Name: device.Name, Location: device.Location, OutOfSync: outOfSync, MissingJobs: missing, LastConfirmedAt: last.SyncedAt})
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"device_jobs": jobs, "device_status": statuses, "source_sync": state}})
}
