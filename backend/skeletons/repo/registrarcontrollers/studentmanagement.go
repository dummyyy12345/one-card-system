package regRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StudentManagementRequest struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type StudentRepository interface {
	GetStudentById(getStudentById *StudentManagementRequest) (registrarmodels.Student, error)
	UpdateStudentCardNumber(updateStudentById *StudentManagementRequest) (registrarmodels.Student, error)
	UpdateStudentPhoto(updateStudentPhoto *StudentManagementRequest) (registrarmodels.Student, error)
}

type StudentUsecase interface {
	GetStudentById(getStudentById *StudentManagementRequest) (registrarmodels.Student, error)
	UpdateStudentCardNumber(updateStudentById *StudentManagementRequest) (registrarmodels.Student, error)
	UpdateStudentPhoto(updateStudentPhoto *StudentManagementRequest) (registrarmodels.Student, error)
}
