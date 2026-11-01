package middlewares

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
)

const requestIDKey = "request_id"

// RequestID generates a server-owned identifier for correlating response and
// application logs without trusting caller-supplied header values.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var idBytes [16]byte
		if _, err := rand.Read(idBytes[:]); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		id := hex.EncodeToString(idBytes[:])
		c.Set(requestIDKey, id)
		c.Header("X-Request-ID", id)
		c.Next()
	}
}

func requestID(c *gin.Context) string {
	return c.GetString(requestIDKey)
}
