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
	"gorm.io/gorm/clause"
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
	var input CardCheckInput
	if err := c.ShouldBindJSON(&input); err != nil || !validCheckInput(input) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card check request"})
		return
	}
	if !authorizeLocation(c, db, input.Location) {
		return
	}
	event, student, err := StoreAccessDecision(db, input, c.GetUint("userId"), "", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to record access decision"})
		return
	}
	response := gin.H{"decision": event.Decision, "reason": event.Reason, "event_id": event.ID, "policy_version": event.PolicyVersion}
	if event.Decision == "allowed" && student != nil {
		response["student"] = gin.H{"id": student.ID, "student_id": student.StudentID, "name": strings.TrimSpace(student.FirstName + " " + student.FatherName)}
	}
	c.JSON(http.StatusOK, response)
}

type CardCheckInput struct {
	CardNumber string `json:"card_number" binding:"required"`
	Location   string `json:"location" binding:"required"`
	Station    string `json:"station" binding:"required"`
}

func validCheckInput(input CardCheckInput) bool {
	return validLocation(input.Location) && len(input.CardNumber) <= 128 && len(input.Station) <= 64 && strings.TrimSpace(input.CardNumber) != "" && strings.TrimSpace(input.Station) != ""
}

var ErrReaderEventCollision = errors.New("reader event ID belongs to another reader")

// StoreAccessDecision applies the current policy and records exactly one decision
// for each external reader event ID. A repeated ID returns the original decision.
func StoreAccessDecision(db *gorm.DB, input CardCheckInput, actorID uint, readerID string, readerEventID *string) (accessmodels.AccessEvent, *registrarmodels.Student, error) {
	if readerEventID != nil {
		var existing accessmodels.AccessEvent
		if err := db.Where("reader_event_id = ?", *readerEventID).First(&existing).Error; err == nil {
			if existing.ReaderID != readerID {
				return accessmodels.AccessEvent{}, nil, ErrReaderEventCollision
			}
			return existing, nil, nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return accessmodels.AccessEvent{}, nil, err
		}
	}
	secret := os.Getenv("API_SECRET")
	if secret == "" {
		return accessmodels.AccessEvent{}, nil, errors.New("API_SECRET is required")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte("card:" + input.CardNumber))
	event := accessmodels.AccessEvent{
		CardFingerprint: hex.EncodeToString(mac.Sum(nil)), Location: input.Location,
		Station: strings.TrimSpace(input.Station), Decision: "denied", Reason: "unknown_card",
		ActorID: actorID, ReaderID: readerID, ReaderEventID: readerEventID,
	}
	policy, err := loadPolicy(db, input.Location)
	if err != nil {
		return accessmodels.AccessEvent{}, nil, err
	}
	event.PolicyVersion = policy.Version
	var student registrarmodels.Student
	err = db.Where("card_number = ?", input.CardNumber).First(&student).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return accessmodels.AccessEvent{}, nil, err
	}
	var found *registrarmodels.Student
	if err == nil {
		found = &student
		event.StudentID = &student.ID
		event.Decision, event.Reason, err = evaluateStudent(db, student, policy, time.Now().UTC())
		if err != nil {
			return accessmodels.AccessEvent{}, nil, err
		}
	}
	result := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&event)
	if result.Error != nil {
		return accessmodels.AccessEvent{}, nil, result.Error
	}
	if result.RowsAffected == 0 && readerEventID != nil {
		if err := db.Where("reader_event_id = ?", *readerEventID).First(&event).Error; err != nil {
			return accessmodels.AccessEvent{}, nil, err
		}
		if event.ReaderID != readerID {
			return accessmodels.AccessEvent{}, nil, ErrReaderEventCollision
		}
		found = nil
	}
	return event, found, nil
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
