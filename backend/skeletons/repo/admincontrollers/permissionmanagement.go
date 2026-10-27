package adminRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreatePermissionRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type PermissionmanagementRepository interface {
	CreatePermission(createPermission *CreatePermissionRequest) (adminmodels.Permissions, error)
	GetPermissions(getPermissions *CreatePermissionRequest) ([]adminmodels.Permissions, error)
	GetPermission(getPermission *CreatePermissionRequest) (adminmodels.Permissions, error)
	UpdatePermission(updatePermission *CreatePermissionRequest) (adminmodels.Permissions, error)
	DeletePermission(deletePermission *CreatePermissionRequest) (adminmodels.Permissions, error)
}

type PermissionmanagementUsecase interface {
	CreatePermission(createPermission *CreatePermissionRequest) (adminmodels.Permissions, error)
	GetPermissions(getPermissions *CreatePermissionRequest) (adminmodels.Permissions, error)
	GetPermission(getPermission *CreatePermissionRequest) (adminmodels.Permissions, error)
	UpdatePermission(creatupdatePermissioneDevice *CreatePermissionRequest) (adminmodels.Permissions, error)
	DeletePermission(deletePermission *CreatePermissionRequest) (adminmodels.Permissions, error)
}
