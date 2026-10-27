package registrarcontrollers

import (
	"context"
	"errors"
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
	saveAndQueue(context.Context, *registrarmodels.Student, []adminmodels.Devices, string, string, bool) error
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

func (store gormStudentUpdateStore) saveAndQueue(ctx context.Context, student *registrarmodels.Student, devices []adminmodels.Devices, kind, previous string, hadPhoto bool) error {
	return store.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(student).Error; err != nil {
			return err
		}
		return queueMediaSync(tx, devices, *student, kind, previous, hadPhoto)
	})
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
	if !registrarCanAccess(c, student) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Student record access denied"})
		return registrarmodels.Student{}, nil, false
	}
	return student, devices, true
}

var cardNumberPattern = regexp.MustCompile(`^[0-9]{8}$`)

func updateStudentCardNumber(c *gin.Context, store studentUpdateStore, _ DeviceClient) {
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
	if !ok {
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
	if err := store.saveAndQueue(c.Request.Context(), &student, devices, "card", previous, false); err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Failed to update card number for student", err)
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"data": student, "sync_status": "queued"})
}

func updateStudentPhoto(c *gin.Context, store studentUpdateStore, _ DeviceClient) {
	var input struct {
		Photo string `json:"photo"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid JSON", err)
		return
	}
	if input.Photo == "" || len(input.Photo) > 8*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo is required"})
		return
	}
	student, devices, ok := loadStudentForUpdate(c, store)
	if !ok {
		return
	}
	hadPhoto := student.Photo != nil && *student.Photo != ""
	student.Photo = &input.Photo
	if student.CardNumber != nil && *student.CardNumber == "" {
		student.CardNumber = nil
	}
	if err := store.saveAndQueue(c.Request.Context(), &student, devices, "photo", "", hadPhoto); err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Failed to update photo of student", err)
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"data": student, "sync_status": "queued"})
}
