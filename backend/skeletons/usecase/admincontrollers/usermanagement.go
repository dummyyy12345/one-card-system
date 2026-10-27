package adminUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
)

type userUsecase struct {
	userRespository adminRepo.UserRepository
}

// NewUserUsecase will create new an userUsecase object representation of userUsecase.UserUsecase interface
func NewUserUsecase(userRespository adminRepo.UserRepository) adminRepo.UserUsecase {
	return &userUsecase{
		userRespository: userRespository,
	}
}

// CreatedUser implements usermanagement.UserUsecase.
func (d *userUsecase) CreateUser(createUser *adminRepo.CreateUserRequest) (adminmodels.Users, error) {
	return d.userRespository.CreateUser(createUser)
}

func (d *userUsecase) GetUsersByRoleId(createUser *adminRepo.CreateUserRequest) (adminmodels.Users, error) {
	return d.userRespository.GetUsersByRoleId(createUser)
}

func (d *userUsecase) UpdateUserById(createUser *adminRepo.CreateUserRequest) (adminmodels.Users, error) {
	return d.userRespository.UpdateUserById(createUser)
}

func (d *userUsecase) DeleteUserById(createUser *adminRepo.CreateUserRequest) (adminmodels.Users, error) {
	return d.userRespository.DeleteUserById(createUser)
}
