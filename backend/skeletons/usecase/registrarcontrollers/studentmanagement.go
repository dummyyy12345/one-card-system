package regUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	regRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/registrarcontrollers"
)

type StudentUsecase struct {
	studentRespository regRepo.StudentRepository
}

func NewStudentUsecase(studentRespository regRepo.StudentRepository) regRepo.StudentUsecase {
	return &StudentUsecase{
		studentRespository: studentRespository,
	}
}

// GetStudentById implements regRepo.StudentUsecase.
func (s *StudentUsecase) GetStudentById(getStudentById *regRepo.StudentManagementRequest) (registrarmodels.Student, error) {
	return s.studentRespository.GetStudentById(getStudentById)
}

// UpdateStudentCardNumber implements regRepo.StudentUsecase.
func (s *StudentUsecase) UpdateStudentCardNumber(updateStudentById *regRepo.StudentManagementRequest) (registrarmodels.Student, error) {
	return s.studentRespository.UpdateStudentCardNumber(updateStudentById)
}

// UpdateStudentPhoto implements regRepo.StudentUsecase.
func (s *StudentUsecase) UpdateStudentPhoto(updateStudentPhoto *regRepo.StudentManagementRequest) (registrarmodels.Student, error) {
	return s.studentRespository.UpdateStudentPhoto(updateStudentPhoto)
}
