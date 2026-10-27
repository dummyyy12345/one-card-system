package accesscontrollers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var readerEventIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{8,80}$`)

type ReaderEvent struct {
	EventID    string `json:"event_id"`
	ReaderID   string `json:"reader_id"`
	CardNumber string `json:"card_number"`
	Location   string `json:"location"`
	Station    string `json:"station"`
}

// ReceiveReaderEvent accepts an online decision request from a registered reader.
// Authentication covers the exact body bytes and a short-lived timestamp.
func ReceiveReaderEvent(c *gin.Context, db *gorm.DB) {
	var keys map[string]string
	if err := json.Unmarshal([]byte(os.Getenv("READER_HMAC_KEYS")), &keys); err != nil || len(keys) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Reader authentication is not configured"})
		return
	}
	body, err := io.ReadAll(io.LimitReader(c.Request.Body, 4097))
	if err != nil || len(body) > 4096 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reader event"})
		return
	}
	var input ReaderEvent
	if err := json.Unmarshal(body, &input); err != nil || !readerEventIDPattern.MatchString(input.EventID) || len(input.ReaderID) == 0 || len(input.ReaderID) > 255 || !validCheckInput(CardCheckInput{CardNumber: input.CardNumber, Location: input.Location, Station: input.Station}) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reader event"})
		return
	}
	secret := keys[input.ReaderID]
	if len(secret) < 32 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Reader authentication failed"})
		return
	}
	timestamp := c.GetHeader("X-Reader-Timestamp")
	seconds, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || time.Since(time.Unix(seconds, 0)) > 5*time.Minute || time.Until(time.Unix(seconds, 0)) > 5*time.Minute {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Reader timestamp is invalid"})
		return
	}
	signature, err := hex.DecodeString(c.GetHeader("X-Reader-Signature"))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp + "\n"))
	mac.Write(body)
	if err != nil || !hmac.Equal(signature, mac.Sum(nil)) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Reader authentication failed"})
		return
	}
	var device adminmodels.Devices
	if err := db.Where("serial_number = ? AND location = ?", input.ReaderID, input.Location).First(&device).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Reader is not registered for this location"})
		return
	}
	event, _, err := StoreAccessDecision(db, CardCheckInput{CardNumber: input.CardNumber, Location: input.Location, Station: input.Station}, 0, input.ReaderID, &input.EventID)
	if errors.Is(err, ErrReaderEventCollision) {
		c.JSON(http.StatusConflict, gin.H{"error": "Reader event ID is already in use"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to record reader decision"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"event_id": event.ID, "decision": event.Decision, "reason": event.Reason, "policy_version": event.PolicyVersion})
}
