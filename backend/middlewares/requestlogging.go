package middlewares

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger records route templates instead of request URLs so query values
// and identifiers do not appear in application logs.
func RequestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		path := c.FullPath()
		if path == "" {
			path = "(unmatched)"
		}
		logger.Info("http_request",
			"method", c.Request.Method,
			"route", path,
			"status", c.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	}
}
