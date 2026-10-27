package accessmodels

import "time"

// AccessEvent is an append-only record of a card decision. CardFingerprint is
// an HMAC, so unknown card numbers are never stored in plaintext.
type AccessEvent struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CreatedAt       time.Time `gorm:"index" json:"created_at"`
	StudentID       *uint     `gorm:"index" json:"student_id,omitempty"`
	CardFingerprint string    `gorm:"type:char(64);not null" json:"-"`
	Location        string    `gorm:"type:varchar(20);not null;index" json:"location"`
	Station         string    `gorm:"type:varchar(64);not null" json:"station"`
	Decision        string    `gorm:"type:varchar(10);not null;index" json:"decision"`
	Reason          string    `gorm:"type:varchar(40);not null" json:"reason"`
	ActorID         uint      `gorm:"not null" json:"actor_id"`
	ReaderEventID   *string   `gorm:"uniqueIndex;type:varchar(80)" json:"reader_event_id,omitempty"`
	ReaderID        string    `gorm:"type:varchar(255);not null;default:''" json:"-"`
	PolicyVersion   uint      `gorm:"not null;default:0" json:"policy_version"`
}
