package adminRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RolepermissionmanagementRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type RolepermissionmanagementRepository interface {
	CreateRolePermission(createRolepermission *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
	GetRolePermissions(getRolepermission *RolepermissionmanagementRequest) ([]adminmodels.Permissions, error)
	GetRolePermissionByRoleId(getRolepermissionById *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
	DeleteRolePermissionById(deleteRolepermissionById *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
	UpdateRolePermission(updateRolepermissionById *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
}

type RolepermissionmanagementUsecase interface {
	CreateRolePermission(createRolepermission *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
	GetRolePermissions(getRolepermission *RolepermissionmanagementRequest) ([]adminmodels.Permissions, error)
	GetRolePermissionByRoleId(getRolepermissionById *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
	DeleteRolePermissionById(deleteRolepermissionById *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
	UpdateRolePermission(updateRolepermissionById *RolepermissionmanagementRequest) (adminmodels.Permissions, error)
}
