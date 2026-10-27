package userRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LoginUserRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type LoginUserRepository interface {
	Login(loginUser *LoginUserRequest) (adminmodels.Users, error)
}
type LoginUserUsecase interface {
	Login(loginUser *LoginUserRequest) (adminmodels.Users, error)
}
