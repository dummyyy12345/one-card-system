package middlewares

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

// StructuredRecovery records a safe panic summary and returns a generic 500.
// Panic values and request URLs may contain credentials or student data, so
// neither is included in the log event.
func StructuredRecovery(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				route := c.FullPath()
				if route == "" {
					route = "(unmatched)"
				}
				logger.Error("http_panic",
					"request_id", requestID(c),
					"method", c.Request.Method,
					"route", route,
					"panic_type", fmt.Sprintf("%T", recovered),
				)
				if c.Writer.Written() {
					c.Abort()
					return
				}
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			}
		}()
		c.Next()
	}
}
