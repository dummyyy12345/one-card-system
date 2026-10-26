package accesscontrollers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func validLocation(location string) bool {
	switch location {
	case "gate", "cafeteria", "dormitory", "library":
		return true
	}
	return false
}

func roleCanAccess(role, location string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin":
		return true
	case "gate":
		return location == "gate"
	case "cafeteria", "cafe":
		return location == "cafeteria"
	case "dormitory":
		return location == "dormitory"
	case "librarian", "library":
		return location == "library"
	}
	return false
}

func authorizeLocation(c *gin.Context, db *gorm.DB, location string) bool {
	if !validLocation(location) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location"})
		return false
	}
	var role adminmodels.Roles
	if err := db.First(&role, c.GetInt("userRole")).Error; err != nil || !roleCanAccess(role.RoleName, location) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Location access denied"})
		return false
	}
	return true
}

func CheckCard(c *gin.Context, db *gorm.DB) {
	var input struct {
		CardNumber string `json:"card_number" binding:"required"`
		Location   string `json:"location" binding:"required"`
		Station    string `json:"station" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || len(input.CardNumber) > 128 || len(input.Station) > 64 || strings.TrimSpace(input.CardNumber) == "" || strings.TrimSpace(input.Station) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card check request"})
		return
	}
	if !authorizeLocation(c, db, input.Location) {
		return
	}
	secret := os.Getenv("API_SECRET")
	if secret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Access service is not configured"})
		return
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte("card:" + input.CardNumber))
	event := accessmodels.AccessEvent{
		CardFingerprint: hex.EncodeToString(mac.Sum(nil)), Location: input.Location,
		Station: strings.TrimSpace(input.Station), Decision: "denied", Reason: "unknown_card",
		ActorID: c.GetUint("userId"),
	}
	var student registrarmodels.Student
	err := db.Where("card_number = ?", input.CardNumber).First(&student).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to check card"})
		return
	}
	if err == nil {
		event.StudentID = &student.ID
		event.Reason = "inactive_student"
		if student.Status == registrarmodels.StatusActive {
			event.Reason = "not_assigned"
			assigned := input.Location == "gate" ||
				(input.Location == "cafeteria" && student.CafeteriaID != nil) ||
				(input.Location == "dormitory" && student.DormitoryID != nil) ||
				(input.Location == "library" && student.LibraryID != nil)
			if assigned {
				event.Decision = "allowed"
				event.Reason = "eligible"
			}
		}
	}
	if err := db.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to record access decision"})
		return
	}
	response := gin.H{"decision": event.Decision, "reason": event.Reason, "event_id": event.ID}
	if event.Decision == "allowed" {
		response["student"] = gin.H{"id": student.ID, "student_id": student.StudentID, "name": strings.TrimSpace(student.FirstName + " " + student.FatherName)}
	}
	c.JSON(http.StatusOK, response)
}

func ListEvents(c *gin.Context, db *gorm.DB) {
	location := c.Query("location")
	if !authorizeLocation(c, db, location) {
		return
	}
	var events []accessmodels.AccessEvent
	if err := db.Where("location = ?", location).Order("created_at DESC").Limit(50).Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load access events"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": events})
}

func Summary(c *gin.Context, db *gorm.DB) {
	location := c.Query("location")
	if !authorizeLocation(c, db, location) {
		return
	}
	var counts []struct {
		Decision string `json:"decision"`
		Count    int64  `json:"count"`
	}
	if err := db.Model(&accessmodels.AccessEvent{}).
		Select("decision, count(*) AS count").
		Where("location = ? AND created_at >= ?", location, time.Now().Add(-24*time.Hour)).
		Group("decision").Scan(&counts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load access summary"})
		return
	}
	totals := gin.H{"allowed": 0, "denied": 0}
	for _, count := range counts {
		totals[count.Decision] = count.Count
	}
	c.JSON(http.StatusOK, gin.H{"data": totals})
}
