package registrarcontrollers

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/SolomonAHailu/one-card-system/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetStudents(c *gin.Context, db *gorm.DB) {
	var students []registrarmodels.Student
	var total int64

	// Query parameters
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")
	status := c.Query("status")
	name := c.Query("name")

	// Parse and validate pagination parameters
	pageInt, err := strconv.Atoi(page)
	if err != nil || pageInt < 1 {
		pageInt = 1
	}
	limitInt, err := strconv.Atoi(limit)
	if err != nil || limitInt < 1 {
		limitInt = 10
	}

	query := db.Model(&registrarmodels.Student{})

	if name != "" {
		query = query.Where("LOWER(first_name) LIKE LOWER(?) OR LOWER(father_name) LIKE LOWER(?) OR LOWER(grand_father_name) LIKE LOWER(?)", "%"+name+"%", "%"+name+"%", "%"+name+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching students count"})
		return
	}

	// Fetch paginated data with Preloads
	if err := query.Preload("LibraryAssigned").
		Preload("CafeteriaAssigned").
		Preload("DormitoryAssigned").
		Preload("RegisteredBy").
		Order("updated_at DESC").
		Limit(limitInt).
		Offset((pageInt - 1) * limitInt).
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching students"})
		return
	}

	totalPages := int64(math.Ceil(float64(total) / float64(limitInt)))

	// Respond with paginated data
	c.JSON(http.StatusOK, gin.H{
		"data":          students,
		"currentPage":   pageInt,
		"totalPages":    totalPages,
		"totalStudents": total,
	})
}

// Get student by id
func GetStudentById(c *gin.Context, db *gorm.DB) {
	var student registrarmodels.Student
	if err := db.Preload("LibraryAssigned").
		Preload("CafeteriaAssigned").
		Preload("DormitoryAssigned").
		Preload("RegisteredBy").First(&student, c.Param("id")).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.ResponseWithError(c, http.StatusNotFound, "Student not found", err)
			return
		}
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching student", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func UpdateStudentCardNumber(c *gin.Context, db *gorm.DB) {
	updateStudentCardNumber(c, gormStudentUpdateStore{db: db}, newDigestDeviceClient())
}

func UpdateStudentPhoto(c *gin.Context, db *gorm.DB) {
	updateStudentPhoto(c, gormStudentUpdateStore{db: db}, newDigestDeviceClient())
}

func GetStudentForDashboard(c *gin.Context, db *gorm.DB) {
	var totalStudents int64
	var studentsByCategory []struct {
		Category string `json:"category"`
		Count    int64  `json:"count"`
	}

	// Get total number of students
	if err := db.Model(&registrarmodels.Student{}).Count(&totalStudents).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching total students", err)
		return
	}

	// Use a raw query to fetch counts for each category
	if err := db.Raw(`
		SELECT 
			'Active Students' AS category, COUNT(*) AS count 
		FROM students WHERE status = 'Active'
		UNION ALL
		SELECT 
			'Inactive Students' AS category, COUNT(*) AS count 
		FROM students WHERE status = 'Inactive'
		UNION ALL
		SELECT 
			'Students with Cards' AS category, COUNT(*) AS count 
		FROM students WHERE card_number IS NOT NULL
		UNION ALL
		SELECT 
			'Students without Cards' AS category, COUNT(*) AS count 
		FROM students WHERE card_number IS NULL
	`).Scan(&studentsByCategory).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching students by category", err)
		return
	}

	// Prepare the response
	c.JSON(http.StatusOK, gin.H{
		"totalStudents":      totalStudents,
		"studentsByCategory": studentsByCategory,
	})
}

func CreateStudentManually(c *gin.Context, db *gorm.DB) {
	var student registrarmodels.Student
	if err := c.ShouldBindJSON(&student); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid JSON", err)
		return
	}
	if err := student.Validate(db); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Validation error", err)
		return
	}
	// Fetch all devices
	var devices []adminmodels.Devices
	if err := db.Find(&devices).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching devices", err)
		return
	}
	//validate student
	if err := student.Validate(db); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Validation error", err)
		return
	}
	//Create student
	if err := db.Create(&student).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error inserting new student", err)
		return
	}
	if err := queueStudentSync(db, devices, student); err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Student saved but device sync could not be queued", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Student successfully created", "data": student})
}

func UpdateStudentManually(c *gin.Context, db *gorm.DB) {
	studentId := c.Param("id")

	var student registrarmodels.Student
	if err := c.ShouldBindJSON(&student); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Invalid JSON", err)
		return
	}
	var existingStudent registrarmodels.Student
	if err := db.First(&existingStudent, "id = ?", studentId).Error; err != nil {
		utils.ResponseWithError(c, http.StatusNotFound, "Student not found", err)
		return
	}

	// Validate the updated student
	if err := student.ValidateForUpdate(db, existingStudent.ID); err != nil {
		utils.ResponseWithError(c, http.StatusBadRequest, "Validation error", err)
		return
	}

	// Use GORM's `Updates` method to update the specific fields
	if err := db.Model(&existingStudent).Updates(student).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error updating student", err)
		return
	}

	// Fetch all devices to send the updated student information
	var devices []adminmodels.Devices
	if err := db.Find(&devices).Error; err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Error fetching devices", err)
		return
	}
	if err := queueStudentSync(db, devices, existingStudent); err != nil {
		utils.ResponseWithError(c, http.StatusInternalServerError, "Student saved but device sync could not be queued", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Student successfully updated", "data": existingStudent})
}
