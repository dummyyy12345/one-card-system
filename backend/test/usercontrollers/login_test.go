package usecase_test

import (
	"errors"
	"testing"

	"github.com/SolomonAHailu/one-card-system/skeletons/mocks"
	user "github.com/SolomonAHailu/one-card-system/skeletons/repo/usercontrollers"
	"github.com/SolomonAHailu/one-card-system/skeletons/usecase/usercontrollers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
)

func TestLoginUser(t *testing.T) {
	// Create a mock repository
	mockUser := mocks.NewLoginUserRepository(t)

	// Mock request
	cc := &gin.Context{}
	dbb := &gorm.DB{}
	mockLoginUserRequest := &user.LoginUserRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	// Mock response
	mockUserTest := adminmodels.Users{
		Email:            "123",
		UnhashedPassword: "123",
	}

	t.Run("success", func(t *testing.T) {
		// Define mock behavior
		mockUser.On("Login", mockLoginUserRequest).Return(mockUserTest, nil).Once()

		// Create a usecase with the mocked repository
		uc := userUsecase.NewLoginUserUsecase(mockUser)

		// Call the usecase method
		user, err := uc.Login(mockLoginUserRequest)

		// Assert expectations
		assert.NoError(t, err)
		assert.Equal(t, mockUserTest, user)
		mockUser.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {
		// Define mock behavior for failure
		mockUser.On("Login", mockLoginUserRequest).Return(adminmodels.Users{}, errors.New("unexpected")).Once()

		// Create a usecase with the mocked repository
		uc := userUsecase.NewLoginUserUsecase(mockUser)

		// Call the usecase method
		user, err := uc.Login(mockLoginUserRequest)

		// Assert expectations
		assert.Error(t, err)
		assert.Equal(t, adminmodels.Users{}, user)
		mockUser.AssertExpectations(t)
	})
}
