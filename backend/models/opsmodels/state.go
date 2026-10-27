package opsmodels

import "time"

// SyncState persists the latest source import outcome across API instances.
type SyncState struct {
	Key           string     `gorm:"primaryKey;type:varchar(40)" json:"key"`
	LastSuccessAt *time.Time `json:"last_success_at"`
	LastFailureAt *time.Time `json:"last_failure_at"`
}
