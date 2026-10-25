package registrarcontrollers

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"regexp"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/SolomonAHailu/one-card-system/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type studentUpdateStore interface {
	devices(context.Context) ([]adminmodels.Devices, error)
	student(context.Context, string) (registrarmodels.Student, error)
	save(context.Context, *registrarmodels.Student) error
}

type gormStudentUpdateStore struct{ db *gorm.DB }

func (store gormStudentUpdateStore) devices(ctx context.Context) ([]adminmodels.Devices, error) {
	var devices []adminmodels.Devices
	err := store.db.WithContext(ctx).Find(&devices).Error
	return devices, err
}

func (store gormStudentUpdateStore) student(ctx context.Context, id string) (registrarmodels.Student, error) {
	var student registrarmodels.Student
	err := store.db.WithContext(ctx).
		Preload("LibraryAssigned").Preload("CafeteriaAssigned").
		Preload("DormitoryAssigned").Preload("RegisteredBy").
		First(&student, "id = ?", id).Error
	return student, err
}

func (store gormStudentUpdateStore) save(ctx context.Context, student *registrarmodels.Student) error {
	return store.db.WithContext(ctx).Save(student).Error
}

func loadStudentForUpdate(c *gin.Context, store studentUpdateStore) (registrarmodels.Student, []adminmodels.Devices, bool) {
	ctx := c.Request.Context()
	devices, err := store.devices(ctx)
	if err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching devices", err)
		return registrarmodels.Student{}, nil, false
	}
	student, err := store.student(ctx, c.Param("id"))
	if err != nil {
		status := http.StatusInternalServerError
		message := "Database error"
		if errors.Is(err, gorm.ErrRecordNotFound) {
			status = http.StatusNotFound
			message = "Student not found"
		}
		utils.ResponseWithError(c, status, message, err)
		return registrarmodels.Student{}, nil, false
	}
	return student, devices, true
}

func checkDevices(c *gin.Context, devices []adminmodels.Devices, client DeviceClient) bool {
	for _, device := range devices {
		if err := client.Check(c.Request.Context(), device); err != nil {
			slog.Error("device_check_failed", "error", err)
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to check device status"})
			return false
		}
	}
	return true
}

var cardNumberPattern = regexp.MustCompile(`^[0-9]{8}$`)

func updateStudentCardNumber(c *gin.Context, store studentUpdateStore, client DeviceClient) {
	var input struct {
		CardNumber string `json:"card_number"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid JSON", err)
		return
	}
	if input.CardNumber != "" && !cardNumberPattern.MatchString(input.CardNumber) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Card number must be 8 digits"})
		return
	}
	student, devices, ok := loadStudentForUpdate(c, store)
	if !ok || !checkDevices(c, devices, client) {
		return
	}
	previous := ""
	if student.CardNumber != nil {
		previous = *student.CardNumber
	}
	if input.CardNumber == "" {
		student.CardNumber = nil
	} else {
		student.CardNumber = &input.CardNumber
	}
	if err := store.save(c.Request.Context(), &student); err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Failed to update card number for student", err)
		return
	}
	for _, device := range devices {
		if err := client.UpdateCard(c.Request.Context(), device, student, previous); err != nil {
			slog.Error("device_card_sync_failed", "error", err)
			c.JSON(http.StatusBadGateway, gin.H{"error": "Card saved, but device synchronization failed"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func updateStudentPhoto(c *gin.Context, store studentUpdateStore, client DeviceClient) {
	var input struct {
		Photo string `json:"photo"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid JSON", err)
		return
	}
	if input.Photo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo is required"})
		return
	}
	student, devices, ok := loadStudentForUpdate(c, store)
	if !ok || !checkDevices(c, devices, client) {
		return
	}
	hadPhoto := student.Photo != nil && *student.Photo != ""
	student.Photo = &input.Photo
	if student.CardNumber != nil && *student.CardNumber == "" {
		student.CardNumber = nil
	}
	if err := store.save(c.Request.Context(), &student); err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Failed to update photo of student", err)
		return
	}
	for _, device := range devices {
		if err := client.UpdatePhoto(c.Request.Context(), device, student, hadPhoto); err != nil {
			slog.Error("device_photo_sync_failed", "error", err)
			c.JSON(http.StatusBadGateway, gin.H{"error": "Photo saved, but device synchronization failed"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": student})
}
