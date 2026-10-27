package adminroutes

import (
	"github.com/SolomonAHailu/one-card-system/controllers/admincontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/gin-gonic/gin"
)

func RegisterAdminRoleManagementRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1/admin").Use(middlewares.AuthMiddleware(), middlewares.RoleRequired(1))
	{
		v1.POST("/roles", func(c *gin.Context) {
			admincontrollers.CreateRole(c, initializers.DB)
		})
		v1.GET("/roles", func(c *gin.Context) {
			admincontrollers.GetRoles(c, initializers.DB)
		})
		v1.GET("/roles/:id", func(c *gin.Context) {
			admincontrollers.GetRole(c, initializers.DB)
		})
		v1.PATCH("/roles/:id", func(c *gin.Context) {
			admincontrollers.UpdateRole(c, initializers.DB)
		})
		v1.DELETE("/roles/:id", func(c *gin.Context) {
			admincontrollers.DeleteRole(c, initializers.DB)
		})
	}
}
