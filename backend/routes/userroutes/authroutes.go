package userroutes

import (
	"github.com/SolomonAHailu/one-card-system/controllers/usercontrollers"
	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/SolomonAHailu/one-card-system/middlewares"
	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1/user")
	{
		v1.POST("/login", func(c *gin.Context) {
			usercontrollers.Login(c, initializers.DB)
		})
		v1.POST("/resetpassword", middlewares.AuthMiddleware(), func(c *gin.Context) {
			usercontrollers.ResetPassword(c, initializers.DB)
		})
	}
}
