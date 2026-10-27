package utils

import (
	"log/slog"

	"github.com/gin-gonic/gin"
)

func ResponseWithError(ctx *gin.Context, status int, message string, err ...error) {
	if len(err) > 0 && err[0] != nil {
		slog.Error("request_failed", "message", message, "error", err[0])
	}
	ctx.JSON(status, gin.H{"error": message})
}
