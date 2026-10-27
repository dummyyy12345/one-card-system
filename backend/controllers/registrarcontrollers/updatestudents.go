package registrarcontrollers

import (
	"errors"
	"net/http"

	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func UpdateStudent(c *gin.Context, db *gorm.DB) {
	var student registrarmodels.Student

	// Bind JSON input to the student object
	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input format"})
		return
	}

	// Extract student ID from the URL
	studentID := c.Param("id")

	// Check if the student exists
	var existingStudent registrarmodels.Student
	if err := db.First(&existingStudent, studentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error finding student"})
		return
	}

	// Update the student's fields
	if err := db.Model(&existingStudent).Updates(student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating student"})
		return
	}

	// Respond with the updated student
	c.JSON(http.StatusOK, gin.H{"message": "Student updated successfully", "data": existingStudent})
}
