package adminRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateRoleRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type RoleRepository interface {
	CreatedRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	GetRoles(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	GetRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	UpdateRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	DeleteRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
}

type RoleUsecase interface {
	CreatedRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	GetRoles(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	GetRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	UpdateRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
	DeleteRole(createRole *CreateRoleRequest) (adminmodels.Roles, error)
}
