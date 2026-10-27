package userUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	user "github.com/SolomonAHailu/one-card-system/skeletons/repo/usercontrollers"
	// "github.com/gin-gonic/gin"
	// "gorm.io/gorm"
)

type LoginUserUsecase struct {
	loginUserRepository user.LoginUserRepository
}

// NewUserUsecase will create new an userUsecase object representation of userUsecase.UserUsecase interface
func NewLoginUserUsecase(loginUserRepository user.LoginUserRepository) user.LoginUserUsecase {
	return &LoginUserUsecase{
		loginUserRepository: loginUserRepository,
	}
}

// CreatedUser implements usermanagement.UserUsecase.
func (d *LoginUserUsecase) Login(loginUser *user.LoginUserRequest) (adminmodels.Users, error) {
	return d.loginUserRepository.Login(loginUser)
}
