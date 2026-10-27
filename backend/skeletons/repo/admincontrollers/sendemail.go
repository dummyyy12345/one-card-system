package adminRepo

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SendEmailRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}
type EmailRequest struct {
	Name            string   `json:"name" binding:"required"`
	To              string   `json:"email" binding:"required"`
	Password        string   `json:"password" binding:"required"`
	Role            string   `json:"role" binding:"required"`
	RoleDescription []string `json:"roledescription" binding:"required"`
	Subject         string   `json:"subject" binding:"required"`
}

type SendEmailRepository interface {
	SendHTMLEmail(sendEmail *SendEmailRequest) (EmailRequest, error)
}

type SendEmailUsecase interface {
	SendHTMLEmail(sendEmail *SendEmailRequest) (EmailRequest, error)
}
