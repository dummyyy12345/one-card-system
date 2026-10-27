package adminUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
)

type userpermissionmanagementUsecase struct {
	userpermissionmanagementRepository adminRepo.UserpermissionmanagementRepository
}

func NewUserPermissionManagementUsecase(userpermissionmanagementRepository adminRepo.UserpermissionmanagementRepository) adminRepo.UserpermissionmanagementUsecase {
	return &userpermissionmanagementUsecase{
		userpermissionmanagementRepository: userpermissionmanagementRepository,
	}
}

// CreateUserPermission implements adminRepo.UserpermissionmanagementUsecase.
func (u *userpermissionmanagementUsecase) CreateUserPermission(userPermissionManagementRequest *adminRepo.UserPermissionManagementRequest) ([]adminmodels.Permissions, error) {
	return u.userpermissionmanagementRepository.CreateUserPermission(userPermissionManagementRequest)
}

// GetUserPermission implements adminRepo.UserpermissionmanagementUsecase.
func (u *userpermissionmanagementUsecase) GetUserPermission(userPermissionManagementRequest *adminRepo.UserPermissionManagementRequest) ([]adminmodels.Permissions, error) {
	return u.userpermissionmanagementRepository.GetUserPermission(userPermissionManagementRequest)
}

// HandleUserPermissionUpdate implements adminRepo.UserpermissionmanagementUsecase.
func (u *userpermissionmanagementUsecase) HandleUserPermissionUpdate(userPermissionManagementRequest *adminRepo.UserPermissionManagementRequest) ([]adminmodels.Permissions, error) {
	return u.userpermissionmanagementRepository.HandleUserPermissionUpdate(userPermissionManagementRequest)
}
