package adminUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
)

type rolepermissionmanagementUsecase struct {
	RolepermissionmanagementRepository adminRepo.RolepermissionmanagementRepository
}

func NewrolepermissionmanagementUsecase(rolepermissionmanagementRepository adminRepo.RolepermissionmanagementRepository) adminRepo.RolepermissionmanagementUsecase {
	return &rolepermissionmanagementUsecase{
		RolepermissionmanagementRepository: rolepermissionmanagementRepository,
	}
}

// CreateRolePermission implements repo.RolepermissionmanagementUsecase.
func (r *rolepermissionmanagementUsecase) CreateRolePermission(creatcreateRolepermissioneDevice *adminRepo.RolepermissionmanagementRequest) (adminmodels.Permissions, error) {
	return r.RolepermissionmanagementRepository.CreateRolePermission(creatcreateRolepermissioneDevice)
}

// GetRolePermissions implements repo.RolepermissionmanagementUsecase.
func (r *rolepermissionmanagementUsecase) GetRolePermissions(deleteRolepermissionById *adminRepo.RolepermissionmanagementRequest) ([]adminmodels.Permissions, error) {
	return r.RolepermissionmanagementRepository.GetRolePermissions(deleteRolepermissionById)
}

// GetRolePermissionByRoleId implements repo.RolepermissionmanagementUsecase.
func (r *rolepermissionmanagementUsecase) GetRolePermissionByRoleId(getRolepermissionById *adminRepo.RolepermissionmanagementRequest) (adminmodels.Permissions, error) {
	return r.RolepermissionmanagementRepository.GetRolePermissionByRoleId(getRolepermissionById)
}

// DeleteRolePermissionById implements repo.RolepermissionmanagementUsecase.
func (r *rolepermissionmanagementUsecase) DeleteRolePermissionById(getRolepermission *adminRepo.RolepermissionmanagementRequest) (adminmodels.Permissions, error) {
	return r.RolepermissionmanagementRepository.DeleteRolePermissionById(getRolepermission)
}

// UpdateRolePermissions implements repo.RolepermissionmanagementUsecase.
func (r *rolepermissionmanagementUsecase) UpdateRolePermission(updateRolepermissionById *adminRepo.RolepermissionmanagementRequest) (adminmodels.Permissions, error) {
	return r.RolepermissionmanagementRepository.UpdateRolePermission(updateRolepermissionById)
}
