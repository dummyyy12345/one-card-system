package adminUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
)

type roleUsecase struct {
	roleRespository adminRepo.RoleRepository
}

func NewRoleUsecase(roleRespository adminRepo.RoleRepository) adminRepo.RoleUsecase {
	return &roleUsecase{
		roleRespository: roleRespository,
	}
}

// CreatedRole implements rolemanagement.RoleUsecase.
func (d *roleUsecase) CreatedRole(createRole *adminRepo.CreateRoleRequest) (adminmodels.Roles, error) {
	return d.roleRespository.CreatedRole(createRole)
}

func (d *roleUsecase) GetRoles(createRole *adminRepo.CreateRoleRequest) (adminmodels.Roles, error) {
	return d.roleRespository.GetRoles(createRole)
}

func (d *roleUsecase) GetRole(createRole *adminRepo.CreateRoleRequest) (adminmodels.Roles, error) {
	return d.roleRespository.GetRole(createRole)
}

func (d *roleUsecase) UpdateRole(createRole *adminRepo.CreateRoleRequest) (adminmodels.Roles, error) {
	return d.roleRespository.UpdateRole(createRole)
}

func (d *roleUsecase) DeleteRole(createRole *adminRepo.CreateRoleRequest) (adminmodels.Roles, error) {
	return d.roleRespository.DeleteRole(createRole)
}
