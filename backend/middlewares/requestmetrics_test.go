package middlewares

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestMetricsUsesRouteTemplate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	metrics := NewRequestMetrics()
	router := gin.New()
	router.Use(metrics.Middleware())
	router.GET("/students/:id", func(c *gin.Context) { c.Status(http.StatusAccepted) })
	router.GET("/metrics", gin.WrapH(metrics.Handler()))

	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/students/private-id?token=secret", nil))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("metrics status = %d", response.Code)
	}
	body := response.Body.String()
	if !strings.Contains(body, `onecard_http_requests_total{method="GET",route="/students/:id",status="202"} 1`) {
		t.Fatalf("request counter missing: %s", body)
	}
	if strings.Contains(body, "private-id") || strings.Contains(body, "secret") {
		t.Fatalf("request values leaked into metrics: %s", body)
	}
}
