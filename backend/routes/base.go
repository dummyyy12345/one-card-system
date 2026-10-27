package routes

import (
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/routes/accessroutes"
	"github.com/SolomonAHailu/one-card-system/routes/adminroutes"
	"github.com/SolomonAHailu/one-card-system/routes/registrarroutes"
	"github.com/SolomonAHailu/one-card-system/routes/userroutes"
	"github.com/gin-gonic/gin"
	"net/http"
)

func RegisterRoutes(r *gin.Engine) {
	r.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	r.GET("/readyz", func(c *gin.Context) {
		if initializers.DB == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "database_unavailable"})
			return
		}
		sqlDB, err := initializers.DB.DB()
		if err != nil || sqlDB.PingContext(c.Request.Context()) != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "database_unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})
	adminroutes.RegisterAdminRoleManagementRoutes(r)
	adminroutes.RegisterAccessPolicyRoutes(r)
	accessroutes.RegisterAccessRoutes(r)
	adminroutes.RegisterAdminPermissionManagementRoutes(r)
	adminroutes.RegisterAdminRolePermissionManagementRoutes(r)
	adminroutes.RegisterUserManagementRoutes(r)
	adminroutes.RegisterUserPermissionManagementRoutes(r)
	adminroutes.RegisterDeviceManagementRoutes(r)
	adminroutes.RegisterSendEmailManagementRoutes(r)
	userroutes.RegisterUserRoutes(r)
	registrarroutes.RegisterStudentManagementRoutes(r)
}
