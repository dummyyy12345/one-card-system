package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/cafeteriamodels"
	"github.com/SolomonAHailu/one-card-system/models/dormitorymodels"
	"github.com/SolomonAHailu/one-card-system/models/librarymodels"
	"github.com/SolomonAHailu/one-card-system/models/opsmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

func init() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	initializers.LoadEnvVariables()
	initializers.ConnectToDB(os.Getenv("DB_DRIVER"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_PORT"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME"))
}

func main() {
	if initializers.DB == nil {
		slog.Error("database_unavailable")
		os.Exit(1)
	}
	if err := initializers.DB.AutoMigrate(adminmodels.Roles{}, adminmodels.Permissions{}, adminmodels.RolePermissions{}, adminmodels.Users{}, adminmodels.UserPermissions{}, adminmodels.Devices{}, cafeteriamodels.Cafeterias{}, dormitorymodels.Dormitories{}, librarymodels.Libraries{}, registrarmodels.Student{}, registrarmodels.DeviceSyncJob{}, accessmodels.AccessEvent{}, accessmodels.AccessPolicy{}, accessmodels.AccessPolicyRevision{}, accessmodels.AccessException{}, accessmodels.StudentViewAudit{}, opsmodels.SyncState{}); err != nil {
		slog.Error("database_migration_failed", "error_type", fmt.Sprintf("%T", err))
		os.Exit(1)
	}
	slog.Info("database_migration_complete")
}
