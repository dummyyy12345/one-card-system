package adminRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateUserRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type UserRepository interface {
	CreateUser(createUser *CreateUserRequest) (adminmodels.Users, error)
	GetUsersByRoleId(createUser *CreateUserRequest) (adminmodels.Users, error)
	DeleteUserById(createUser *CreateUserRequest) (adminmodels.Users, error)
	UpdateUserById(createUser *CreateUserRequest) (adminmodels.Users, error)
}

type UserUsecase interface {
	CreateUser(createUser *CreateUserRequest) (adminmodels.Users, error)
	GetUsersByRoleId(createUser *CreateUserRequest) (adminmodels.Users, error)
	DeleteUserById(createUser *CreateUserRequest) (adminmodels.Users, error)
	UpdateUserById(createUser *CreateUserRequest) (adminmodels.Users, error)
}
