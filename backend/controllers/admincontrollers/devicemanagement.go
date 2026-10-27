package admincontrollers

import (
	"log/slog"
	"net/http"

	"github.com/SolomonAHailu/one-card-system/controllers/registrarcontrollers"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	// "github.com/SolomonAHailu/one-card-system/models/cafeteriamodels"
	// "github.com/SolomonAHailu/one-card-system/models/dormitorymodels"
	// "github.com/SolomonAHailu/one-card-system/models/librarymodels"
	// "github.com/SolomonAHailu/one-card-system/models/maingatemodels"
	"github.com/SolomonAHailu/one-card-system/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// create device with location type and ID
func CreateDevice(c *gin.Context, db *gorm.DB) {
	var device adminmodels.Devices
	if err := c.ShouldBindJSON(&device); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid input", err)
		return
	}
	if err := device.ValidateDevice(db); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid input", err)
		return
	}
	if err := db.Create(&device).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error creating device", err)
		return
	}
	if err := registrarcontrollers.QueueDeviceBackfill(db, device); err != nil {
		slog.Error("device_backfill_queue_failed", "device_id", device.ID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Device created, but student sync could not be queued", "data": device})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Device successfully created",
		"data":    device,
	})
}

// get all devices
func GetAllDevices(c *gin.Context, db *gorm.DB) {
	var devices []adminmodels.Devices
	if err := db.Order("updated_at DESC").Find(&devices).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching devices", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Devices successfully fetched", "data": devices})
}

// Get device by id
func GetDeviceById(c *gin.Context, db *gorm.DB) {
	var device adminmodels.Devices
	if err := db.First(&device, c.Param("id")).Error; err != nil {
		utils.ResponseWithError(c, http.StatusNotFound, "Device not found", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Device successfully fetched", "data": device})
}

// UpdateDeviceById updates a device by ID with location type and ID
func UpdateDeviceById(c *gin.Context, db *gorm.DB) {
	var device adminmodels.Devices

	// Fetch the device by ID
	if err := db.First(&device, c.Param("id")).Error; err != nil {
		utils.ResponseWithError(c, http.StatusNotFound, "Device not found", err)
		return
	}

	// Parse the incoming request payload into a temporary variable
	var updatedDevice adminmodels.Devices
	if err := c.ShouldBindJSON(&updatedDevice); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid input", err)
		return
	}

	// Validate the updated device data
	if err := updatedDevice.ValidateDeviceForUpdate(db, device.ID); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Validation error", err)
		return
	}

	// Use GORM's Updates method to update the device
	if err := db.Model(&device).Updates(updatedDevice).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error updating device", err)
		return
	}
	if err := registrarcontrollers.QueueDeviceBackfill(db, device); err != nil {
		slog.Error("device_backfill_queue_failed", "device_id", device.ID, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Device updated, but student sync could not be queued", "data": device})
		return
	}

	// Respond with the updated device data
	c.JSON(http.StatusOK, gin.H{"message": "Device successfully updated", "data": device})
}

// Delete device by id
func DeleteDeviceById(c *gin.Context, db *gorm.DB) {
	var device adminmodels.Devices
	if err := db.First(&device, c.Param("id")).Error; err != nil {
		utils.ResponseWithError(c, http.StatusNotFound, "Device not found", err)
		return
	}
	if err := db.Delete(&device).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error deleting device", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Device successfully deleted", "data": device})
}

/*
package admincontrollers

import (
  "bytes"
  "encoding/json"
  "net/http"
  "net/http/httptest"
  "testing"

  "github.com/SolomonAHailu/one-card-system/models/adminmodels"
  "github.com/SolomonAHailu/one-card-system/utils"
  "github.com/gin-gonic/gin"
  "github.com/stretchr/testify/assert"
  "gorm.io/driver/sqlite"
  "gorm.io/gorm"
)

// Helper function to set up a mock database
func setupMockDB() *gorm.DB {
  db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
  db.AutoMigrate(&adminmodels.Devices{})
  return db
}

// Helper function to create a mock context
func createTestContext(method, path, body string) (*gin.Context, *httptest.ResponseRecorder) {
  gin.SetMode(gin.TestMode)
  w := httptest.NewRecorder()
  c, _ := gin.CreateTestContext(w)

  req := httptest.NewRequest(method, path, bytes.NewBufferString(body))
  req.Header.Set("Content-Type", "application/json")
  c.Request = req

  return c, w
}

func TestCreateDevice(t *testing.T) {
  db := setupMockDB()

  tests := []struct {
    name           string
    inputBody      string
    expectedStatus int
    expectedError  string
  }{
    {
      name:           "Valid device creation",
      inputBody:      {"serial_number": "123ABC", "name": "Device1", "ip_address": "192.168.1.1", "port": 8080, "location": "Building A"},
      expectedStatus: http.StatusCreated,
      expectedError:  "",
    },
    {
      name:           "Missing serial number",
      inputBody:      {"name": "Device2", "ip_address": "192.168.1.2", "port": 8081, "location": "Building B"},
      expectedStatus: http.StatusBadRequest,
      expectedError:  "Serial number cannot be empty",
    },
    {
      name:           "Duplicate serial number",
      inputBody:      {"serial_number": "123ABC", "name": "Device1", "ip_address": "192.168.1.1", "port": 8080, "location": "Building A"},
      expectedStatus: http.StatusBadRequest,
      expectedError:  "Serial number already exists",
    },
  }

  // Seed the database with a device to test duplicates
  db.Create(&adminmodels.Devices{
    SerialNumber: "123ABC",
    Name:         "Device1",
    IPAddress:    "192.168.1.1",
    Port:         8080,
    Location:     "Building A",
  })

  for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
      c, w := createTestContext(http.MethodPost, "/devices", tt.inputBody)

      CreateDevice(c, db)

      assert.Equal(t, tt.expectedStatus, w.Code)

      if tt.expectedError != "" {
        var response map[string]string
        _ = json.Unmarshal(w.Body.Bytes(), &response)
        assert.Contains(t, response["error"], tt.expectedError)
      }
    })
  }
}

func TestGetAllDevices(t *testing.T) {
  db := setupMockDB()
  // Seed the database
  db.Create(&adminmodels.Devices{
    SerialNumber: "123ABC",
    Name:         "Device1",
    IPAddress:    "192.168.1.1",
    Port:         8080,
    Location:     "Building A",
  })

  c, w := createTestContext(http.MethodGet, "/devices", "")

  GetAllDevices(c, db)

  assert.Equal(t, http.StatusOK, w.Code)

  var response map[string]interface{}
  _ = json.Unmarshal(w.Body.Bytes(), &response)

  assert.Equal(t, float64(1), response["count"].(float64))
}

func TestGetDeviceById(t *testing.T) {
  db := setupMockDB()
  // Seed the database
  device := adminmodels.Devices{
    SerialNumber: "123ABC",
    Name:         "Device1",
    IPAddress:    "192.168.1.1",
    Port:         8080,
    Location:     "Building A",
  }
  db.Create(&device)

  tests := []struct {
    name           string
    id             string
    expectedStatus int
    expectedError  string
  }{
    {
      name:           "Valid device ID",
      id:             "1",
      expectedStatus: http.StatusOK,
      expectedError:  "",
    },
    {
      name:           "Invalid device ID",
      id:             "999",
      expectedStatus: http.StatusNotFound,
      expectedError:  "Device not found",
    },
  }

*/
