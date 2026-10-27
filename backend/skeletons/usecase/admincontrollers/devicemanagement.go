package adminUsecase

import (
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	adminRepo "github.com/SolomonAHailu/one-card-system/skeletons/repo/admincontrollers"
	// "github.com/gin-gonic/gin"
	// "gorm.io/gorm"
)

type deviceUsecase struct {
	deviceRespository adminRepo.DeviceRepository
}

func NewDeviceUsecase(deviceRespository adminRepo.DeviceRepository) adminRepo.DeviceUsecase {
	return &deviceUsecase{
		deviceRespository: deviceRespository,
	}
}

// CreatedDevice implements repo.DeviceUsecase.
func (d *deviceUsecase) CreatedDevice(createDevice *adminRepo.CreateDeviceReques) (adminmodels.Devices, error) {
	return d.deviceRespository.CreatedDevice(createDevice)
}

func (d *deviceUsecase) GetAllDevices(createDevice *adminRepo.CreateDeviceReques) (adminmodels.Devices, error) {
	return d.deviceRespository.GetAllDevices(createDevice)
}

func (d *deviceUsecase) GetDeviceById(createDevice *adminRepo.CreateDeviceReques) (adminmodels.Devices, error) {
	return d.deviceRespository.GetDeviceById(createDevice)
}

func (d *deviceUsecase) UpdateDeviceById(createDevice *adminRepo.CreateDeviceReques) (adminmodels.Devices, error) {
	return d.deviceRespository.UpdateDeviceById(createDevice)
}

func (d *deviceUsecase) DeleteDeviceById(createDevice *adminRepo.CreateDeviceReques) (adminmodels.Devices, error) {
	return d.deviceRespository.DeleteDeviceById(createDevice)
}
