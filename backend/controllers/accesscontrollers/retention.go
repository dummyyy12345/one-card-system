package accesscontrollers

import (
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"gorm.io/gorm"
)

// PurgeExpiredAudit deletes bounded batches only when a retention period is set.
func PurgeExpiredAudit(db *gorm.DB, now time.Time) error {
	for _, target := range []struct {
		env, column string
		model       interface{}
	}{
		{"ACCESS_EVENT_RETENTION_DAYS", "created_at", &accessmodels.AccessEvent{}},
		{"STUDENT_VIEW_AUDIT_RETENTION_DAYS", "viewed_at", &accessmodels.StudentViewAudit{}},
	} {
		value := os.Getenv(target.env)
		if value == "" || value == "0" {
			continue
		}
		days, err := strconv.Atoi(value)
		if err != nil || days < 1 || days > 36500 {
			slog.Error("invalid_audit_retention", "setting", target.env)
			continue
		}
		cutoff := now.Add(-time.Duration(days) * 24 * time.Hour)
		for {
			var ids []uint
			if err := db.Model(target.model).Where(target.column+" < ?", cutoff).Order("id").Limit(500).Pluck("id", &ids).Error; err != nil {
				return err
			}
			if len(ids) == 0 {
				break
			}
			if err := db.Delete(target.model, ids).Error; err != nil {
				return err
			}
			if len(ids) < 500 {
				break
			}
		}
	}
	return nil
}
