package middlewares

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestLoggerRecordsRouteWithoutRequestValues(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	router := gin.New()
	router.Use(RequestLogger(slog.New(slog.NewJSONHandler(&output, nil))))
	router.GET("/students/:id", func(c *gin.Context) {
		c.Status(http.StatusAccepted)
	})

	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/students/sensitive-student-id?token=private", nil))
	if response.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusAccepted)
	}

	var event struct {
		Message string `json:"msg"`
		Method  string `json:"method"`
		Route   string `json:"route"`
		Status  int    `json:"status"`
	}
	if err := json.Unmarshal(output.Bytes(), &event); err != nil {
		t.Fatalf("decode JSON log: %v", err)
	}
	if event.Message != "http_request" || event.Method != http.MethodGet || event.Route != "/students/:id" || event.Status != http.StatusAccepted {
		t.Fatalf("unexpected request log: %+v", event)
	}
	if strings.Contains(output.String(), "sensitive-student-id") || strings.Contains(output.String(), "private") {
		t.Fatalf("request values leaked into log: %s", output.String())
	}
}
