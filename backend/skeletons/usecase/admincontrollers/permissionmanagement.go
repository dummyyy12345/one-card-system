package adminUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
	// "github.com/gin-gonic/gin"
	// "gorm.io/gorm"
)

type permissionmanagementUsecase struct {
	permissionmanagementRepository adminRepo.PermissionmanagementRepository
}

func NewpermissionmanagementUsecase(permissionmanagementRepository adminRepo.PermissionmanagementRepository) adminRepo.PermissionmanagementRepository {
	return &permissionmanagementUsecase{
		permissionmanagementRepository: permissionmanagementRepository,
	}
}

// CreatePermission implements adminRepo.PermissionmanagementRepository.
func (p *permissionmanagementUsecase) CreatePermission(createPermission *adminRepo.CreatePermissionRequest) (adminmodels.Permissions, error) {
	return p.permissionmanagementRepository.CreatePermission(createPermission)
}

// GetPermissions implements adminRepo.PermissionmanagementRepository.
func (p *permissionmanagementUsecase) GetPermissions(getPermissions *adminRepo.CreatePermissionRequest) ([]adminmodels.Permissions, error) {
	return p.permissionmanagementRepository.GetPermissions(getPermissions)
}

// GetPermission implements adminRepo.PermissionmanagementRepository.
func (p *permissionmanagementUsecase) GetPermission(getPermission *adminRepo.CreatePermissionRequest) (adminmodels.Permissions, error) {
	return p.permissionmanagementRepository.GetPermission(getPermission)
}

// UpdatePermission implements adminRepo.PermissionmanagementRepository.
func (p *permissionmanagementUsecase) UpdatePermission(updatePermission *adminRepo.CreatePermissionRequest) (adminmodels.Permissions, error) {
	return p.permissionmanagementRepository.UpdatePermission(updatePermission)
}

// DeletePermission implements adminRepo.PermissionmanagementRepository.
func (p *permissionmanagementUsecase) DeletePermission(deletePermission *adminRepo.CreatePermissionRequest) (adminmodels.Permissions, error) {
	return p.permissionmanagementRepository.DeletePermission(deletePermission)
}
