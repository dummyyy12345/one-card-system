package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func corsResponse(method, origin string) *httptest.ResponseRecorder {
	router := gin.New()
	router.Use(CORSMiddleware())
	router.Any("/resource", func(c *gin.Context) { c.Status(http.StatusOK) })
	request := httptest.NewRequest(method, "/resource", nil)
	request.Header.Set("Origin", origin)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func TestCORSDefaultsToLocalFrontend(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "")
	response := corsResponse(http.MethodOptions, "http://localhost:3000")
	if response.Code != http.StatusNoContent || response.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" || response.Header().Get("Access-Control-Allow-Credentials") != "true" || response.Header().Get("Vary") != "Origin" {
		t.Fatalf("unexpected local preflight response: status=%d headers=%v", response.Code, response.Header())
	}
}

func TestCORSUsesOnlyConfiguredExactOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://portal.example.edu, https://admin.example.edu, *")
	allowed := corsResponse(http.MethodOptions, "https://portal.example.edu")
	if allowed.Code != http.StatusNoContent || allowed.Header().Get("Access-Control-Allow-Origin") != "https://portal.example.edu" {
		t.Fatalf("configured origin was rejected: status=%d headers=%v", allowed.Code, allowed.Header())
	}
	for _, origin := range []string{"http://localhost:3000", "https://evil.example.edu", "https://portal.example.edu.evil.test", "null"} {
		response := corsResponse(http.MethodOptions, origin)
		if response.Code != http.StatusForbidden || response.Header().Get("Access-Control-Allow-Origin") != "" || response.Header().Get("Access-Control-Allow-Credentials") != "" {
			t.Fatalf("origin %q was allowed: status=%d headers=%v", origin, response.Code, response.Header())
		}
	}
}
