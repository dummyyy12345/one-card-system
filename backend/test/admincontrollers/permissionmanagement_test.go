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

func TestCreatePermission(t *testing.T) {
	mockPermissionmanagementRepository := mocks.NewPermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreatePermissionRequest := &adminRepo.CreatePermissionRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockPermissionmanagementRepository.On("CreatePermission", mockCreatePermissionRequest).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.CreatePermission(mockCreatePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockPermissionmanagementRepository.On("CreatePermission", mockCreatePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.CreatePermission(mockCreatePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestGetPermissions(t *testing.T) {
	mockPermissionmanagementRepository := mocks.NewPermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreatePermissionRequest := &adminRepo.CreatePermissionRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermissions := []adminmodels.Permissions{
		{
			PermissionsName: "test",
			Description:     "test",
		},
		{
			PermissionsName: "test1",
			Description:     "test1",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockPermissionmanagementRepository.On("GetPermissions", mockCreatePermissionRequest).Return(mockPermissions, nil).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.GetPermissions(mockCreatePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermissions, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockPermissionmanagementRepository.On("GetPermissions", mockCreatePermissionRequest).Return([]adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.GetPermissions(mockCreatePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, []adminmodels.Permissions{}, permission)
		assert.Len(t, permission, 0)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestGetPermission(t *testing.T) {
	mockPermissionmanagementRepository := mocks.NewPermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreatePermissionRequest := &adminRepo.CreatePermissionRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockPermissionmanagementRepository.On("GetPermission", mockCreatePermissionRequest).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.GetPermission(mockCreatePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockPermissionmanagementRepository.On("GetPermission", mockCreatePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.GetPermission(mockCreatePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestUpdatePermission(t *testing.T) {
	mockPermissionmanagementRepository := mocks.NewPermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreatePermissionRequest := &adminRepo.CreatePermissionRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockPermissionmanagementRepository.On("UpdatePermission", mockCreatePermissionRequest).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.UpdatePermission(mockCreatePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockPermissionmanagementRepository.On("UpdatePermission", mockCreatePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.UpdatePermission(mockCreatePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

}

func TestDeletePermission(t *testing.T) {
	mockPermissionmanagementRepository := mocks.NewPermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreatePermissionRequest := &adminRepo.CreatePermissionRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := adminmodels.Permissions{
		PermissionsName: "test",
		Description:     "test",
	}

	t.Run("success", func(t *testing.T) {

		mockPermissionmanagementRepository.On("DeletePermission", mockCreatePermissionRequest).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.DeletePermission(mockCreatePermissionRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockPermissionmanagementRepository.On("DeletePermission", mockCreatePermissionRequest).Return(adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewpermissionmanagementUsecase(mockPermissionmanagementRepository)
		permission, err := uc.DeletePermission(mockCreatePermissionRequest)

		assert.Error(t, err)
		assert.Equal(t, adminmodels.Permissions{}, permission)
		mockPermissionmanagementRepository.AssertExpectations(t)
	})

}
