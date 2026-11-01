package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SolomonAHailu/one-card-system/initializers"
	"github.com/gin-gonic/gin"
)

func TestServerRegistersHealthReadinessMetricsAndRecovery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previousDB := initializers.DB
	initializers.DB = nil
	t.Cleanup(func() { initializers.DB = previousDB })

	server := NewServer()
	server.Initialize()
	server.Router.GET("/test/panic", func(c *gin.Context) { panic("private value") })

	for _, test := range []struct {
		path   string
		status int
		body   string
	}{
		{"/healthz", http.StatusOK, `"status":"ok"`},
		{"/readyz", http.StatusServiceUnavailable, `"status":"database_unavailable"`},
		{"/metrics", http.StatusOK, "http_requests_total"},
		{"/test/panic", http.StatusInternalServerError, `"error":"internal server error"`},
	} {
		t.Run(test.path, func(t *testing.T) {
			response := httptest.NewRecorder()
			server.Router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, test.path, nil))
			if response.Code != test.status || !strings.Contains(response.Body.String(), test.body) {
				t.Fatalf("GET %s: status=%d body=%q", test.path, response.Code, response.Body.String())
			}
			if response.Header().Get("X-Request-ID") == "" {
				t.Fatalf("GET %s: missing request ID", test.path)
			}
		})
	}
	metrics := httptest.NewRecorder()
	server.Router.ServeHTTP(metrics, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if !strings.Contains(metrics.Body.String(), `route="/test/panic",status="500"`) {
		t.Fatalf("panic was not recorded as a 500 response: %s", metrics.Body.String())
	}
}
