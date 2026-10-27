package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestResponseWithErrorLogsDetailsButReturnsSafeMessage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previous := slog.Default()
	var logs bytes.Buffer
	slog.SetDefault(slog.New(slog.NewJSONHandler(&logs, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })

	response := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(response)
	ResponseWithError(c, http.StatusInternalServerError, "Database error", errors.New("private database detail"))
	if response.Code != http.StatusInternalServerError || bytes.Contains(response.Body.Bytes(), []byte("private database detail")) {
		t.Fatalf("unsafe response: status=%d body=%s", response.Code, response.Body.String())
	}
	var event map[string]any
	if err := json.Unmarshal(logs.Bytes(), &event); err != nil {
		t.Fatalf("decode structured log: %v", err)
	}
	if event["msg"] != "request_failed" || event["message"] != "Database error" || event["error"] != "private database detail" {
		t.Fatalf("unexpected log event: %v", event)
	}
}
