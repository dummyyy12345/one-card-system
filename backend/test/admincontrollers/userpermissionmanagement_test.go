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

func TestCreateUserPermission(t *testing.T) {
	mockUserpermissionmanagementRepo := mocks.NewUserpermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserPermission := &adminRepo.UserPermissionManagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := []adminmodels.Permissions{
		{
			PermissionsName: "test",
			Description:     "test",
		},
		{
			PermissionsName: "test",
			Description:     "test",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUserpermissionmanagementRepo.On("CreateUserPermission", mockCreateUserPermission).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewUserPermissionManagementUsecase(mockUserpermissionmanagementRepo)
		permission, err := uc.CreateUserPermission(mockCreateUserPermission)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockUserpermissionmanagementRepo.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUserpermissionmanagementRepo.On("CreateUserPermission", mockCreateUserPermission).Return([]adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserPermissionManagementUsecase(mockUserpermissionmanagementRepo)
		permission, err := uc.CreateUserPermission(mockCreateUserPermission)

		assert.Error(t, err)
		assert.Equal(t, []adminmodels.Permissions{}, permission)
		assert.Len(t, permission, 0)
		mockUserpermissionmanagementRepo.AssertExpectations(t)
	})

}

func TestGetUserPermission(t *testing.T) {
	mockUserpermissionmanagementRepo := mocks.NewUserpermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserPermission := &adminRepo.UserPermissionManagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := []adminmodels.Permissions{
		{
			PermissionsName: "test",
			Description:     "test",
		},
		{
			PermissionsName: "test",
			Description:     "test",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUserpermissionmanagementRepo.On("GetUserPermission", mockCreateUserPermission).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewUserPermissionManagementUsecase(mockUserpermissionmanagementRepo)
		permission, err := uc.GetUserPermission(mockCreateUserPermission)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockUserpermissionmanagementRepo.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUserpermissionmanagementRepo.On("GetUserPermission", mockCreateUserPermission).Return([]adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserPermissionManagementUsecase(mockUserpermissionmanagementRepo)
		permission, err := uc.GetUserPermission(mockCreateUserPermission)

		assert.Error(t, err)
		assert.Equal(t, []adminmodels.Permissions{}, permission)
		assert.Len(t, permission, 0)
		mockUserpermissionmanagementRepo.AssertExpectations(t)
	})

}

func TestHandleUserPermissionUpdate(t *testing.T) {
	mockUserpermissionmanagementRepo := mocks.NewUserpermissionmanagementRepository(t)

	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserPermission := &adminRepo.UserPermissionManagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockPermission := []adminmodels.Permissions{
		{
			PermissionsName: "test",
			Description:     "test",
		},
		{
			PermissionsName: "test",
			Description:     "test",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUserpermissionmanagementRepo.On("HandleUserPermissionUpdate", mockCreateUserPermission).Return(mockPermission, nil).Once()
		uc := adminUsecase.NewUserPermissionManagementUsecase(mockUserpermissionmanagementRepo)
		permission, err := uc.HandleUserPermissionUpdate(mockCreateUserPermission)

		assert.NoError(t, err)
		assert.Equal(t, mockPermission, permission)
		mockUserpermissionmanagementRepo.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUserpermissionmanagementRepo.On("HandleUserPermissionUpdate", mockCreateUserPermission).Return([]adminmodels.Permissions{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserPermissionManagementUsecase(mockUserpermissionmanagementRepo)
		permission, err := uc.HandleUserPermissionUpdate(mockCreateUserPermission)

		assert.Error(t, err)
		assert.Equal(t, []adminmodels.Permissions{}, permission)
		assert.Len(t, permission, 0)
		mockUserpermissionmanagementRepo.AssertExpectations(t)
	})

}
