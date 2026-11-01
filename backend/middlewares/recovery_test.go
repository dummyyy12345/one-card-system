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

func TestStructuredRecoveryReturnsGenericErrorAndCorrelatesLog(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var output bytes.Buffer
	router := gin.New()
	router.Use(RequestID(), StructuredRecovery(slog.New(slog.NewJSONHandler(&output, nil))))
	router.GET("/students/:id", func(c *gin.Context) {
		panic("private panic value")
	})

	request := httptest.NewRequest(http.MethodGet, "/students/private-student-id?token=private-token", nil)
	request.Header.Set("X-Request-ID", "attacker-supplied")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError || strings.Contains(response.Body.String(), "private") {
		t.Fatalf("unexpected recovery response: status=%d body=%q", response.Code, response.Body.String())
	}
	var event struct {
		Message   string `json:"msg"`
		RequestID string `json:"request_id"`
		Method    string `json:"method"`
		Route     string `json:"route"`
		PanicType string `json:"panic_type"`
	}
	if err := json.Unmarshal(output.Bytes(), &event); err != nil {
		t.Fatalf("decode JSON recovery log: %v", err)
	}
	if event.Message != "http_panic" || event.Method != http.MethodGet || event.Route != "/students/:id" || event.PanicType != "string" {
		t.Fatalf("unexpected recovery log: %+v", event)
	}
	if event.RequestID == "" || event.RequestID != response.Header().Get("X-Request-ID") || event.RequestID == "attacker-supplied" {
		t.Fatalf("unexpected recovery request ID: %q", event.RequestID)
	}
	for _, sensitive := range []string{"private panic value", "private-student-id", "private-token", "attacker-supplied"} {
		if strings.Contains(output.String(), sensitive) {
			t.Fatalf("sensitive request value leaked into recovery log: %q", sensitive)
		}
	}
}
