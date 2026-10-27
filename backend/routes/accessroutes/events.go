package accessroutes

import (
	"github.com/SolomonAHailu/one-card-system/controllers/accesscontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/gin-gonic/gin"
)

func RegisterAccessRoutes(r *gin.Engine) {
	r.POST("/api/v1/access/reader-events", func(c *gin.Context) { accesscontrollers.ReceiveReaderEvent(c, initializers.DB) })
	v1 := r.Group("/api/v1/access").Use(middlewares.AuthMiddleware())
	v1.POST("/check", func(c *gin.Context) { accesscontrollers.CheckCard(c, initializers.DB) })
	v1.GET("/events", func(c *gin.Context) { accesscontrollers.ListEvents(c, initializers.DB) })
	v1.GET("/summary", func(c *gin.Context) { accesscontrollers.Summary(c, initializers.DB) })
}
