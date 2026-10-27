package adminUsecase

import (
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
)

type sendEmailUsecase struct {
	sendEmailRespository adminRepo.SendEmailRepository
}

// NewUserUsecase will create new an userUsecase object representation of userUsecase.UserUsecase interface
func NewSendEmailUsecase(sendEmailRespository adminRepo.SendEmailRepository) adminRepo.SendEmailUsecase {
	return &sendEmailUsecase{
		sendEmailRespository: sendEmailRespository,
	}
}

// CreatedUser implements usermanagement.UserUsecase.
func (d *sendEmailUsecase) SendHTMLEmail(sendEmail *adminRepo.SendEmailRequest) (adminRepo.EmailRequest, error) {
	return d.sendEmailRespository.SendHTMLEmail(sendEmail)
}
