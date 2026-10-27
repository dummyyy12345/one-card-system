package registrarmodels

import (
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/cafeteriamodels"
	"github.com/SolomonAHailu/one-card-system/models/dormitorymodels"
	"github.com/SolomonAHailu/one-card-system/models/librarymodels"
	"gorm.io/gorm"
)

type SexType string
type StatusType string

const (
	SexMale   SexType = "Male"
	SexFemale SexType = "Female"
)

const (
	StatusActive   StatusType = "Active"
	StatusInactive StatusType = "Inactive"
)

type Student struct {
	gorm.Model
	StudentID         string                      `gorm:"type:varchar(255);not null;index" json:"student_id"`
	CardNumber        *string                     `gorm:"type:varchar(255);default:NULL;uniqueIndex" json:"card_number"`
	FirstName         string                      `gorm:"type:varchar(255);not null" json:"first_name"`
	FatherName        string                      `gorm:"type:varchar(255);not null" json:"father_name"`
	GrandFatherName   string                      `gorm:"type:varchar(255);not null" json:"grand_father_name"`
	Email             string                      `gorm:"type:varchar(255);not null;uniqueIndex" json:"email"`
	Phone             string                      `gorm:"type:varchar(255);not null" json:"phone"`
	Sex               SexType                     `gorm:"type:varchar(50);not null" json:"sex"`
	DateOfBirth       time.Time                   `gorm:"type:date;not null" json:"date_of_birth"`
	Program           string                      `gorm:"type:varchar(255);not null" json:"program"`
	Section           string                      `gorm:"type:varchar(255);not null" json:"section"`
	Year              int                         `gorm:"type:int;not null" json:"year"`
	Semester          int                         `gorm:"type:int;not null" json:"semester"`
	Religion          string                      `gorm:"type:varchar(255)" json:"religion"`
	Photo             *string                     `gorm:"type:text;default:NULL" json:"photo"`
	LibraryID         *int                        `gorm:"type:int;null" json:"library_id"`
	LibraryAssigned   librarymodels.Libraries     `gorm:"foreignKey:LibraryID;references:ID" json:"library_assigned"`
	CafeteriaID       *int                        `gorm:"type:int;null" json:"cafeteria_id"`
	CafeteriaAssigned cafeteriamodels.Cafeterias  `gorm:"foreignKey:CafeteriaID;references:ID" json:"cafeteria_assigned"`
	DormitoryID       *int                        `gorm:"type:int;null" json:"dormitory_id"`
	DormitoryAssigned dormitorymodels.Dormitories `gorm:"foreignKey:DormitoryID;references:ID" json:"dormitory_assigned"`
	RegisteredByID    *int                        `gorm:"type:int;null" json:"registered_by_id"`
	RegisteredBy      adminmodels.Users           `gorm:"foreignKey:RegisteredByID;references:ID" json:"registered_by"`
	RegisteredDate    time.Time                   `gorm:"type:date;not null" json:"registered_date"`
	Status            StatusType                  `gorm:"type:varchar(50);not null" json:"status"`
	IsManuallyAdd     bool                        `gorm:"type:bool;not null;default:false" json:"is_manually_add"`
}

func (s *Student) Validate(db *gorm.DB) error {
	// Non-null validations
	if s.StudentID == "" {
		return errors.New("student id is required")
	}
	if s.FirstName == "" {
		return errors.New("first name is required")
	}
	if s.FatherName == "" {
		return errors.New("father name is required")
	}
	if s.GrandFatherName == "" {
		return errors.New("grand father name is required")
	}
	if s.Email == "" {
		return errors.New("email is required")
	}
	if s.Phone == "" {
		return errors.New("phone number is required")
	}
	if s.Program == "" {
		return errors.New("program is required")
	}
	if s.Section == "" {
		return errors.New("section is required")
	}
	if s.Year <= 0 {
		return errors.New("year must be greater than zero")
	}
	if s.Semester <= 0 || s.Semester > 2 {
		return errors.New("semester must be 1 or 2")
	}
	if s.DateOfBirth.IsZero() {
		return errors.New("date of birth is required")
	}

	// Sex validation
	if s.Sex != SexMale && s.Sex != SexFemale {
		return fmt.Errorf("invalid sex value: %s", s.Sex)
	}

	// Status validation
	if s.Status != StatusActive && s.Status != StatusInactive {
		return fmt.Errorf("invalid status value: %s", s.Status)
	}

	// Email format validation
	if _, err := mail.ParseAddress(s.Email); err != nil {
		return fmt.Errorf("invalid email format: %s", s.Email)
	}

	// Phone number validation (basic example)
	phoneRegex := regexp.MustCompile(`^0\d{9}$`)
	if !phoneRegex.MatchString(s.Phone) {
		return fmt.Errorf("invalid phone number: %s", s.Phone)
	}

	// Unique constraints (considering soft deletes)
	fmt.Printf("Validating StudentID: %s, ID: %d\n", s.StudentID, s.ID)
	var count int64
	if err := db.Model(&Student{}).Where("student_id = ? AND deleted_at IS NULL", s.StudentID).Count(&count).Error; err != nil {
		return fmt.Errorf("error checking student id uniqueness: %v", err)
	}
	if count > 0 {
		return fmt.Errorf("student id must be unique: %s", s.StudentID)
	}

	if s.CardNumber != nil {
		if err := db.Model(&Student{}).Where("card_number = ? AND deleted_at IS NULL", *s.CardNumber).Count(&count).Error; err != nil {
			return fmt.Errorf("error checking card number uniqueness: %v", err)
		}
		if count > 0 {
			return fmt.Errorf("card number must be unique: %s", *s.CardNumber)
		}
	}

	if err := db.Model(&Student{}).Where("email = ? AND deleted_at IS NULL", s.Email).Count(&count).Error; err != nil {
		return fmt.Errorf("error checking email uniqueness: %v", err)
	}
	if count > 0 {
		return fmt.Errorf("email must be unique: %s", s.Email)
	}

	// All validations passed
	return nil
}

func (s *Student) ValidateForUpdate(db *gorm.DB, currentID uint) error {
	// Non-null validations
	if s.StudentID == "" {
		return errors.New("student id is required")
	}
	if s.FirstName == "" {
		return errors.New("first name is required")
	}
	if s.FatherName == "" {
		return errors.New("father name is required")
	}
	if s.GrandFatherName == "" {
		return errors.New("grand father name is required")
	}
	if s.Email == "" {
		return errors.New("email is required")
	}
	if s.Phone == "" {
		return errors.New("phone number is required")
	}
	if s.Program == "" {
		return errors.New("program is required")
	}
	if s.Section == "" {
		return errors.New("section is required")
	}
	if s.Year <= 0 {
		return errors.New("year must be greater than zero")
	}
	if s.Semester <= 0 || s.Semester > 2 {
		return errors.New("semester must be 1 or 2")
	}
	if s.DateOfBirth.IsZero() {
		return errors.New("date of birth is required")
	}

	// Sex validation
	if s.Sex != SexMale && s.Sex != SexFemale {
		return fmt.Errorf("invalid sex value: %s", s.Sex)
	}

	// Status validation
	if s.Status != StatusActive && s.Status != StatusInactive {
		return fmt.Errorf("invalid status value: %s", s.Status)
	}

	// Email format validation
	if _, err := mail.ParseAddress(s.Email); err != nil {
		return fmt.Errorf("invalid email format: %s", s.Email)
	}

	// Phone number validation (basic example)
	phoneRegex := regexp.MustCompile(`^0\d{9}$`)
	if !phoneRegex.MatchString(s.Phone) {
		return fmt.Errorf("invalid phone number: %s", s.Phone)
	}

	// Unique constraints (considering soft deletes)
	var count int64
	if err := db.Model(&Student{}).Where("student_id = ? AND deleted_at IS NULL AND id != ?", s.StudentID, currentID).Count(&count).Error; err != nil {
		return fmt.Errorf("error checking student id uniqueness: %v", err)
	}
	if count > 0 {
		return fmt.Errorf("student id must be unique: %s", s.StudentID)
	}

	if s.CardNumber != nil {
		if err := db.Model(&Student{}).Where("card_number = ? AND deleted_at IS NULL AND id != ?", *s.CardNumber, currentID).Count(&count).Error; err != nil {
			return fmt.Errorf("error checking card number uniqueness: %v", err)
		}
		if count > 0 {
			return fmt.Errorf("card number must be unique: %s", *s.CardNumber)
		}
	}

	if err := db.Model(&Student{}).Where("email = ? AND deleted_at IS NULL AND id != ?", s.Email, currentID).Count(&count).Error; err != nil {
		return fmt.Errorf("error checking email uniqueness: %v", err)
	}
	if count > 0 {
		return fmt.Errorf("email must be unique: %s", s.Email)
	}

	// All validations passed
	return nil
}
