package accessmodels

import "time"

// AccessPolicy is one active policy per location. Times are UTC minutes since midnight.
type AccessPolicy struct {
	ID                uint   `gorm:"primaryKey" json:"id"`
	Location          string `gorm:"uniqueIndex;type:varchar(20);not null" json:"location"`
	Enabled           bool   `gorm:"not null" json:"enabled"`
	RequireAssignment bool   `gorm:"not null" json:"require_assignment"`
	StartMinute       int    `gorm:"not null;default:0" json:"start_minute"`
	EndMinute         int    `gorm:"not null;default:1440" json:"end_minute"`
	// Weekdays is seven characters for Sunday through Saturday; 1 means open.
	Weekdays  string    `gorm:"type:char(7);not null;default:'1111111'" json:"weekdays"`
	Version   uint      `gorm:"not null;default:1" json:"version"`
	UpdatedBy uint      `gorm:"not null" json:"updated_by"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AccessPolicyRevision preserves the rules that produced historical decisions.
type AccessPolicyRevision struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	Location          string    `gorm:"index;type:varchar(20);not null" json:"location"`
	Version           uint      `gorm:"index;not null" json:"version"`
	Enabled           bool      `json:"enabled"`
	RequireAssignment bool      `json:"require_assignment"`
	StartMinute       int       `json:"start_minute"`
	EndMinute         int       `json:"end_minute"`
	Weekdays          string    `gorm:"type:char(7)" json:"weekdays"`
	UpdatedBy         uint      `json:"updated_by"`
	CreatedAt         time.Time `json:"created_at"`
}

// AccessException grants one student a temporary location exception.
type AccessException struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"index;not null" json:"student_id"`
	Location  string    `gorm:"type:varchar(20);not null;index" json:"location"`
	ExpiresAt time.Time `gorm:"index;not null" json:"expires_at"`
	Reason    string    `gorm:"type:varchar(255);not null" json:"reason"`
	CreatedBy uint      `gorm:"not null" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

// StudentViewAudit records who viewed a student detail page without copying PII.
type StudentViewAudit struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"index;not null" json:"student_id"`
	ActorID   uint      `gorm:"index;not null" json:"actor_id"`
	ViewedAt  time.Time `gorm:"index;not null" json:"viewed_at"`
}
