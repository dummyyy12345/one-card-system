package registrarcontrollers

import (
	"net/http"

	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Imported students have no registrar owner. Manually created students stay
// within their creator's record scope.
func registrarCanAccess(c *gin.Context, student registrarmodels.Student) bool {
	actorID := c.GetUint("userId")
	return actorID == 0 || student.RegisteredByID == nil || *student.RegisteredByID == int(actorID)
}

func requireStudentScope(c *gin.Context, db *gorm.DB, id string) bool {
	var student registrarmodels.Student
	if err := db.Select("id", "registered_by_id").First(&student, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return false
	}
	if !registrarCanAccess(c, student) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Student record access denied"})
		return false
	}
	return true
}
