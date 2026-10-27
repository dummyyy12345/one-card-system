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
)

func TestSendEmail(t *testing.T) {
	mockUser := mocks.NewSendEmailRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockSendEmailRequest := &adminRepo.SendEmailRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	mockUserTest := adminRepo.EmailRequest{
		Name:            "123",
		To:              "123",
		Password:        "123",
		Role:            "123",
		RoleDescription: []string{"123"},
		Subject:         "123",
	}

	t.Run("success", func(t *testing.T) {

		mockUser.On("SendHTMLEmail", mockSendEmailRequest).Return(mockUserTest, nil).Once()
		uc := adminUsecase.NewSendEmailUsecase(mockUser)
		email, err := uc.SendHTMLEmail(mockSendEmailRequest)

		assert.NoError(t, err)
		assert.Equal(t, mockUserTest, email)
		mockUser.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockUser.On("SendHTMLEmail", mockSendEmailRequest).Return(adminRepo.EmailRequest{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewSendEmailUsecase(mockUser)
		user, err := uc.SendHTMLEmail(mockSendEmailRequest)

		assert.Error(t, err)
		assert.Equal(t, user, adminRepo.EmailRequest{})
		mockUser.AssertExpectations(t)
	})
}
