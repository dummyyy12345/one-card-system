package adminRepo

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateDeviceReques struct {
	Ctx *gin.Context
	Gm  *gorm.DB
}

type DeviceRepository interface {
	CreatedDevice(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	GetAllDevices(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	GetDeviceById(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	UpdateDeviceById(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	DeleteDeviceById(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
}

type DeviceUsecase interface {
	CreatedDevice(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	GetAllDevices(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	GetDeviceById(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	UpdateDeviceById(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
	DeleteDeviceById(createDevice *CreateDeviceReques) (adminmodels.Devices, error)
}
