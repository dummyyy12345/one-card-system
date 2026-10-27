package usecase_test

import (
	"errors"
	"testing"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/skeletons/mocks"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
	adminUsecase "github.com/SolomonAHailu/one-card-system/skeletons/usecase/admincontrollers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestCreateRolePermission(t *testing.T) {
	mockRolepermissionmanagementRepository := mocks.NewRolepermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateRolePermissionRequest := &adminRepo.RolepermissionmanagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("CreateRolePermission", mockCreateRolePermissionRequest).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permission, err := uc.CreateRolePermission(mockCreateRolePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("CreateRolePermission", mockCreateRolePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permission, err := uc.CreateRolePermission(mockCreateRolePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permission)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestGetRolePermissions(t *testing.T) {
	mockRolepermissionmanagementRepository := mocks.NewRolepermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateRolePermissionRequest := &adminRepo.RolepermissionmanagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermissions := []adminmodels.Permissions{
		{
			PermissionsName: "test",
			Description:     "test",
		},
		{
			PermissionsName: "test2",
			Description:     "test2",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("GetRolePermissions", mockCreateRolePermissionRequest).Return(mockPermissions, nil).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.GetRolePermissions(mockCreateRolePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermissions, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("GetRolePermissions", mockCreateRolePermissionRequest).Return([]adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.GetRolePermissions(mockCreateRolePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, []adminmodels.Permissions{}, permissions)
		assert.Len(t, permissions, 0)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestGetRolePermissionByRoleId(t *testing.T) {
	mockRolepermissionmanagementRepository := mocks.NewRolepermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateRolePermissionRequest := &adminRepo.RolepermissionmanagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermissions := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("GetRolePermissionByRoleId", mockCreateRolePermissionRequest).Return(mockPermissions, nil).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.GetRolePermissionByRoleId(mockCreateRolePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermissions, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("GetRolePermissionByRoleId", mockCreateRolePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.GetRolePermissionByRoleId(mockCreateRolePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestDeleteRolePermissionById(t *testing.T) {
	mockRolepermissionmanagementRepository := mocks.NewRolepermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateRolePermissionRequest := &adminRepo.RolepermissionmanagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermissions := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("DeleteRolePermissionById", mockCreateRolePermissionRequest).Return(mockPermissions, nil).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.DeleteRolePermissionById(mockCreateRolePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermissions, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("DeleteRolePermissionById", mockCreateRolePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.DeleteRolePermissionById(mockCreateRolePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestUpdateRolePermission(t *testing.T) {
	mockRolepermissionmanagementRepository := mocks.NewRolepermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateRolePermissionRequest := &adminRepo.RolepermissionmanagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermissions := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("UpdateRolePermission", mockCreateRolePermissionRequest).Return(mockPermissions, nil).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.UpdateRolePermission(mockCreateRolePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermissions, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockRolepermissionmanagementRepository.On("UpdateRolePermission", mockCreateRolePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewrolepermissionmanagementUsecase(mockRolepermissionmanagementRepository)
		permissions, err := uc.UpdateRolePermission(mockCreateRolePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permissions)
		mockRolepermissionmanagementRepository.AssertExpectations(t)
	})

}
