package main

import (
	"log"
	"os"

	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/models/accessmodels"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/cafeteriamodels"
	"github.com/SolomonAHailu/one-card-system/models/dormitorymodels"
	"github.com/SolomonAHailu/one-card-system/models/librarymodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

func init() {
	initializers.LoadEnvVariables()
	initializers.ConnectToDB(os.Getenv("DB_DRIVER"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_PORT"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME"))
}

func main() {
	if initializers.DB == nil {
		log.Fatal("Database connection is not initialized")
	}
	initializers.DB.Debug().AutoMigrate(adminmodels.Roles{}, adminmodels.Permissions{}, adminmodels.RolePermissions{}, adminmodels.Users{}, adminmodels.UserPermissions{}, adminmodels.Devices{}, cafeteriamodels.Cafeterias{}, dormitorymodels.Dormitories{}, librarymodels.Libraries{}, registrarmodels.Student{}, registrarmodels.DeviceSyncJob{}, accessmodels.AccessEvent{})
}
