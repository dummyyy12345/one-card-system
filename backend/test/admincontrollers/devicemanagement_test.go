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

func TestCreateDevice(t *testing.T) {
	mockDevice := mocks.NewDeviceRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &adminRepo.CreateDeviceReques{
		Ctx: cc,
		Gm:  dbb,
	}

	mockDeviceTest := adminmodels.Devices{
		SerialNumber: "123",
		Name:         "123",
		IPAddress:    "123",
		Port:         123,
		Location:     "123",
	}

	t.Run("success", func(t *testing.T) {

		mockDevice.On("CreatedDevice", mockCreateDeviceReques).Return(mockDeviceTest, nil).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.CreatedDevice(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, mockDeviceTest, device)
		mockDevice.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockDevice.On("CreatedDevice", mockCreateDeviceReques).Return(adminmodels.Devices{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.CreatedDevice(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, device, adminmodels.Devices{})
		mockDevice.AssertExpectations(t)
	})
}

func TestGetAllDevices(t *testing.T) {
	mockDevice := mocks.NewDeviceRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &adminRepo.CreateDeviceReques{
		Ctx: cc,
		Gm:  dbb,
	}

	mockDeviceTest := adminmodels.Devices{
		SerialNumber: "123",
		Name:         "123",
		IPAddress:    "123",
		Port:         123,
		Location:     "123",
	}

	t.Run("success", func(t *testing.T) {

		mockDevice.On("GetAllDevices", mockCreateDeviceReques).Return(mockDeviceTest, nil).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.GetAllDevices(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, mockDeviceTest, device)
		mockDevice.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockDevice.On("GetAllDevices", mockCreateDeviceReques).Return(adminmodels.Devices{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.GetAllDevices(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, device, adminmodels.Devices{})
		mockDevice.AssertExpectations(t)
	})
}

func TestGetDeviceById(t *testing.T) {
	mockDevice := mocks.NewDeviceRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &adminRepo.CreateDeviceReques{
		Ctx: cc,
		Gm:  dbb,
	}

	mockDeviceTest := adminmodels.Devices{
		SerialNumber: "123",
		Name:         "123",
		IPAddress:    "123",
		Port:         123,
		Location:     "123",
	}

	t.Run("success", func(t *testing.T) {

		mockDevice.On("GetDeviceById", mockCreateDeviceReques).Return(mockDeviceTest, nil).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.GetDeviceById(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, mockDeviceTest, device)
		mockDevice.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockDevice.On("GetDeviceById", mockCreateDeviceReques).Return(adminmodels.Devices{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.GetDeviceById(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, device, adminmodels.Devices{})
		mockDevice.AssertExpectations(t)
	})
}

func TestUpdateDeviceById(t *testing.T) {
	mockDevice := mocks.NewDeviceRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &adminRepo.CreateDeviceReques{
		Ctx: cc,
		Gm:  dbb,
	}

	mockDeviceTest := adminmodels.Devices{
		SerialNumber: "123",
		Name:         "123",
		IPAddress:    "123",
		Port:         123,
		Location:     "123",
	}

	t.Run("success", func(t *testing.T) {

		mockDevice.On("UpdateDeviceById", mockCreateDeviceReques).Return(mockDeviceTest, nil).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.UpdateDeviceById(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, mockDeviceTest, device)
		mockDevice.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockDevice.On("UpdateDeviceById", mockCreateDeviceReques).Return(adminmodels.Devices{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.UpdateDeviceById(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, device, adminmodels.Devices{})
		mockDevice.AssertExpectations(t)
	})
}

func TestDeleteDeviceById(t *testing.T) {
	mockDevice := mocks.NewDeviceRepository(t)
	cc := &gin.Context{}
	dbb := &gorm.DB{}

	mockCreateDeviceReques := &adminRepo.CreateDeviceReques{
		Ctx: cc,
		Gm:  dbb,
	}

	mockDeviceTest := adminmodels.Devices{
		SerialNumber: "123",
		Name:         "123",
		IPAddress:    "123",
		Port:         123,
		Location:     "123",
	}

	t.Run("success", func(t *testing.T) {

		mockDevice.On("DeleteDeviceById", mockCreateDeviceReques).Return(mockDeviceTest, nil).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.DeleteDeviceById(mockCreateDeviceReques)

		assert.NoError(t, err)
		assert.Equal(t, mockDeviceTest, device)
		mockDevice.AssertExpectations(t)
	})

	t.Run("fail", func(t *testing.T) {

		mockDevice.On("DeleteDeviceById", mockCreateDeviceReques).Return(adminmodels.Devices{}, errors.New("unexpected")).Once()
		uc := adminUsecase.NewDeviceUsecase(mockDevice)
		device, err := uc.DeleteDeviceById(mockCreateDeviceReques)

		assert.Error(t, err)
		assert.Equal(t, device, adminmodels.Devices{})
		mockDevice.AssertExpectations(t)
	})
}
