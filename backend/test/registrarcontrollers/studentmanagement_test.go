package usecase_test

import (
	"errors"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/SolomonAHailu/one-card-system/skeletons/mocks"
	regRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/registrarcontrollers"
	regUsecase "github.com/SolomonAHailu/one-card-system/skeletons/usecase/registrarcontrollers"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
	"testing"
	"time"
)

func TestGetStudentById(t *testing.T) {
	mockStudentRepo := mocks.NewStudentRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &regRepo.StudentManagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	CardNumber := "TEST-CARD-001"
	Photo := "http://example.com/photos/test1.jpg"
	LibraryID := 1
	CafeteriaID := 1
	DormitoryID := 1
	RegisteredByID := 1

	mockStudent := registrarmodels.Student{
		StudentID:       "TEST-STU-1001",
		CardNumber:      &CardNumber,
		FirstName:       "TestFirstName1",
		FatherName:      "TestFatherName1",
		GrandFatherName: "TestGrandFatherName1",
		Email:           "test1.student@example.com",
		Phone:           "+251900000001",
		Sex:             "Male",
		DateOfBirth:     time.Date(2001, time.March, 25, 0, 0, 0, 0, time.UTC),
		Program:         "TestProgram1",
		Section:         "A",
		Year:            1,
		Semester:        1,
		Religion:        "TestReligion1",
		Photo:           &Photo,
		LibraryID:       &LibraryID,
		CafeteriaID:     &CafeteriaID,
		DormitoryID:     &DormitoryID,
		RegisteredByID:  &RegisteredByID,
		RegisteredDate:  time.Now(),
	}

	t.Run("success", func(t *testing.T) {

		mockStudentRepo.On("GetStudentById", mockCreateDeviceReques).Return(mockStudent, nil).Once()
		uc := regUsecase.NewStudentUsecase(mockStudentRepo)
		student, err := uc.GetStudentById(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, student, mockStudent)
		mockStudentRepo.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockStudentRepo.On("GetStudentById", mockCreateDeviceReques).Return(registrarmodels.Student{}, errors.New("unexpected")).Once()
		uc := regUsecase.NewStudentUsecase(mockStudentRepo)
		student, err := uc.GetStudentById(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, registrarmodels.Student{}, student)
		mockStudentRepo.AssertExpectations(t)
	})

}

func TestUpdateStudentCardNumber(t *testing.T) {
	mockStudentRepo := mocks.NewStudentRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &regRepo.StudentManagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	CardNumber := "TEST-CARD-001"
	Photo := "http://example.com/photos/test1.jpg"
	LibraryID := 1
	CafeteriaID := 1
	DormitoryID := 1
	RegisteredByID := 1

	mockStudent := registrarmodels.Student{
		StudentID:       "TEST-STU-1001",
		CardNumber:      &CardNumber,
		FirstName:       "TestFirstName1",
		FatherName:      "TestFatherName1",
		GrandFatherName: "TestGrandFatherName1",
		Email:           "test1.student@example.com",
		Phone:           "+251900000001",
		Sex:             "Male",
		DateOfBirth:     time.Date(2001, time.March, 25, 0, 0, 0, 0, time.UTC),
		Program:         "TestProgram1",
		Section:         "A",
		Year:            1,
		Semester:        1,
		Religion:        "TestReligion1",
		Photo:           &Photo,
		LibraryID:       &LibraryID,
		CafeteriaID:     &CafeteriaID,
		DormitoryID:     &DormitoryID,
		RegisteredByID:  &RegisteredByID,
		RegisteredDate:  time.Now(),
	}

	t.Run("success", func(t *testing.T) {

		mockStudentRepo.On("UpdateStudentCardNumber", mockCreateDeviceReques).Return(mockStudent, nil).Once()
		uc := regUsecase.NewStudentUsecase(mockStudentRepo)
		student, err := uc.UpdateStudentCardNumber(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, student, mockStudent)
		mockStudentRepo.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockStudentRepo.On("UpdateStudentCardNumber", mockCreateDeviceReques).Return(registrarmodels.Student{}, errors.New("unexpected")).Once()
		uc := regUsecase.NewStudentUsecase(mockStudentRepo)
		student, err := uc.UpdateStudentCardNumber(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, registrarmodels.Student{}, student)
		mockStudentRepo.AssertExpectations(t)
	})

}

func TestUpdateStudentPhoto(t *testing.T) {
	mockStudentRepo := mocks.NewStudentRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &regRepo.StudentManagementRequest{
		Ctx: cc,
		Gm:  dbb,
	}

	CardNumber := "TEST-CARD-001"
	Photo := "http://example.com/photos/test1.jpg"
	LibraryID := 1
	CafeteriaID := 1
	DormitoryID := 1
	RegisteredByID := 1

	mockStudent := registrarmodels.Student{
		StudentID:       "TEST-STU-1001",
		CardNumber:      &CardNumber,
		FirstName:       "TestFirstName1",
		FatherName:      "TestFatherName1",
		GrandFatherName: "TestGrandFatherName1",
		Email:           "test1.student@example.com",
		Phone:           "+251900000001",
		Sex:             "Male",
		DateOfBirth:     time.Date(2001, time.March, 25, 0, 0, 0, 0, time.UTC),
		Program:         "TestProgram1",
		Section:         "A",
		Year:            1,
		Semester:        1,
		Religion:        "TestReligion1",
		Photo:           &Photo,
		LibraryID:       &LibraryID,
		CafeteriaID:     &CafeteriaID,
		DormitoryID:     &DormitoryID,
		RegisteredByID:  &RegisteredByID,
		RegisteredDate:  time.Now(),
	}

	t.Run("success", func(t *testing.T) {

		mockStudentRepo.On("UpdateStudentPhoto", mockCreateDeviceReques).Return(mockStudent, nil).Once()
		uc := regUsecase.NewStudentUsecase(mockStudentRepo)
		student, err := uc.UpdateStudentPhoto(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, student, mockStudent)
		mockStudentRepo.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockStudentRepo.On("UpdateStudentPhoto", mockCreateDeviceReques).Return(registrarmodels.Student{}, errors.New("unexpected")).Once()
		uc := regUsecase.NewStudentUsecase(mockStudentRepo)
		student, err := uc.UpdateStudentPhoto(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, registrarmodels.Student{}, student)
		mockStudentRepo.AssertExpectations(t)
	})

}
