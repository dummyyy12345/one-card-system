package adminroutes

import (
	"net/http"
	"strconv"

	"github.com/SolomonAHailu/one-card-system/controllers/accesscontrollers"
	"github.com/SolomonAHailu/one-card-system/controllers/registrarcontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/SolomonAHailu/one-card-system/models/adminmodels"
	"github.com/gin-gonic/gin"
)

func RegisterAccessPolicyRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1/admin/access").Use(middlewares.AuthMiddleware(), middlewares.RoleRequired(1))
	v1.GET("/policies", func(c *gin.Context) { accesscontrollers.ListPolicies(c, initializers.DB) })
	v1.PUT("/policies/:location", func(c *gin.Context) { accesscontrollers.SavePolicy(c, initializers.DB) })
	v1.GET("/policies/:location/revisions", func(c *gin.Context) { accesscontrollers.ListPolicyRevisions(c, initializers.DB) })
	v1.GET("/exceptions", func(c *gin.Context) { accesscontrollers.ListExceptions(c, initializers.DB) })
	v1.POST("/exceptions", func(c *gin.Context) { accesscontrollers.CreateException(c, initializers.DB) })
	v1.DELETE("/exceptions/:id", func(c *gin.Context) { accesscontrollers.DeleteException(c, initializers.DB) })
	v1.GET("/student-views", func(c *gin.Context) { accesscontrollers.ListStudentViews(c, initializers.DB) })
	v1.GET("/operations", func(c *gin.Context) { accesscontrollers.Operations(c, initializers.DB) })
	v1.POST("/devices/:id/reconcile", func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
			return
		}
		var device adminmodels.Devices
		if err := initializers.DB.First(&device, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
			return
		}
		if err := registrarcontrollers.QueueDeviceBackfill(initializers.DB, device); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to queue reconciliation"})
			return
		}
		c.JSON(http.StatusAccepted, gin.H{"status": "queued"})
	})
}
