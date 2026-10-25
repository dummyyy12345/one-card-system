package usecase_test

import (
	"errors"
	"github.com/SolomonAHailu/one-card-system/skeletons/mocks"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
	adminUsecase "github.com/SolomonAHailu/one-card-system/skeletons/usecase/admincontrollers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
	"testing"

	// "github.com/stretchr/testify/mock"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
)

func TestCreateUser(t *testing.T) {
	mockUser := mocks.NewUserRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserRequest := &adminRepo.CreateUserRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockUserTest := adminmodels.Users{
		FirstName:        "123",
		FatherName:       "123",
		GrandFatherName:  "123",
		Email:            "123",
		Password:         "123",
		UnhashedPassword: "123",
		RoleId:           1,
		Role: adminmodels.Roles{
			RoleName:    "123",
			Description: "123",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUser.On("CreateUser", mockCreateUserRequest).Return(mockUserTest, nil).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.CreateUser(mockCreateUserRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockUserTest, user)
		mockUser.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUser.On("CreateUser", mockCreateUserRequest).Return(adminmodels.Users{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.CreateUser(mockCreateUserRequest)

		assert.Error(t, err)
		assert.Equal(t, user, adminmodels.Users{})
		mockUser.AssertExpectations(t)
	})
}

func TestGetUsersByRoleId(t *testing.T) {
	mockUser := mocks.NewUserRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserRequest := &adminRepo.CreateUserRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockUserTest := adminmodels.Users{
		FirstName:        "123",
		FatherName:       "123",
		GrandFatherName:  "123",
		Email:            "123",
		Password:         "123",
		UnhashedPassword: "123",
		RoleId:           1,
		Role: adminmodels.Roles{
			RoleName:    "123",
			Description: "123",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUser.On("GetUsersByRoleId", mockCreateUserRequest).Return(mockUserTest, nil).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.GetUsersByRoleId(mockCreateUserRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockUserTest, user)
		mockUser.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUser.On("GetUsersByRoleId", mockCreateUserRequest).Return(adminmodels.Users{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.GetUsersByRoleId(mockCreateUserRequest)

		assert.Error(t, err)
		assert.Equal(t, user, adminmodels.Users{})
		mockUser.AssertExpectations(t)
	})
}

func TestUpdateUserById(t *testing.T) {
	mockUser := mocks.NewUserRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserRequest := &adminRepo.CreateUserRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockUserTest := adminmodels.Users{
		FirstName:        "123",
		FatherName:       "123",
		GrandFatherName:  "123",
		Email:            "123",
		Password:         "123",
		UnhashedPassword: "123",
		RoleId:           1,
		Role: adminmodels.Roles{
			RoleName:    "123",
			Description: "123",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUser.On("UpdateUserById", mockCreateUserRequest).Return(mockUserTest, nil).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.UpdateUserById(mockCreateUserRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockUserTest, user)
		mockUser.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUser.On("UpdateUserById", mockCreateUserRequest).Return(adminmodels.Users{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.UpdateUserById(mockCreateUserRequest)

		assert.Error(t, err)
		assert.Equal(t, user, adminmodels.Users{})
		mockUser.AssertExpectations(t)
	})
}

func TestDeleteUserById(t *testing.T) {
	mockUser := mocks.NewUserRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateUserRequest := &adminRepo.CreateUserRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockUserTest := adminmodels.Users{
		FirstName:        "123",
		FatherName:       "123",
		GrandFatherName:  "123",
		Email:            "123",
		Password:         "123",
		UnhashedPassword: "123",
		RoleId:           1,
		Role: adminmodels.Roles{
			RoleName:    "123",
			Description: "123",
		},
	}

	t.Run("success", func(t *testing.T) {

		mockUser.On("DeleteUserById", mockCreateUserRequest).Return(mockUserTest, nil).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.DeleteUserById(mockCreateUserRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockUserTest, user)
		mockUser.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUser.On("DeleteUserById", mockCreateUserRequest).Return(adminmodels.Users{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewUserUsecase(mockUser)
		user, err := uc.DeleteUserById(mockCreateUserRequest)

		assert.Error(t, err)
		assert.Equal(t, user, adminmodels.Users{})
		mockUser.AssertExpectations(t)
	})
}
