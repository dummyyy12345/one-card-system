package registrarmodels

import (
	"time"

	"gorm.io/gorm"
)

// DeviceSyncJob records delivery of the current student record to one device.
type DeviceSyncJob struct {
	gorm.Model
	StudentID     uint       `gorm:"uniqueIndex:idx_student_device_sync;not null" json:"student_id"`
	DeviceID      uint       `gorm:"uniqueIndex:idx_student_device_sync;not null" json:"device_id"`
	Status        string     `gorm:"type:varchar(20);not null;index" json:"status"`
	Revision      uint       `gorm:"not null;default:1" json:"revision"`
	Attempts      int        `gorm:"not null;default:0" json:"attempts"`
	NextAttemptAt time.Time  `gorm:"index" json:"next_attempt_at"`
	SyncedAt      *time.Time `json:"synced_at"`
	LastError     string     `gorm:"type:varchar(255)" json:"last_error"`
	LeaseUntil    *time.Time `gorm:"index" json:"lease_until,omitempty"`
	SyncCard      bool       `gorm:"not null;default:false" json:"sync_card"`
	SyncPhoto     bool       `gorm:"not null;default:false" json:"sync_photo"`
	HadPhoto      bool       `gorm:"not null;default:false" json:"-"`
	// CardRemovals is a JSON array of old card numbers still needing removal.
	CardRemovals string `gorm:"type:text;not null;default:'[]'" json:"-"`
}
