package registrarroutes

import (
	"github.com/SolomonAHailu/one-card-system/controllers/registrarcontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/gin-gonic/gin"
)

func RegisterStudentUpdateRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1/student")
	{
		// Register the Update Student route
		v1.PUT("/:id", func(c *gin.Context) {
			registrarcontrollers.UpdateStudent(c, initializers.DB)
		})
	}
}
