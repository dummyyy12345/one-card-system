package userroutes

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SolomonAHailu/one-card-system/security"
	"github.com/gin-gonic/gin"
)

func TestResetPasswordRequiresOwner(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("API_SECRET", "reset-password-test-secret")
	token, err := security.GenerateJwt(7, "user@example.com", 2)
	if err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	RegisterUserRoutes(router)
	for _, tc := range []struct {
		name, token string
		status      int
	}{
		{"anonymous", "", http.StatusUnauthorized},
		{"other user", token, http.StatusForbidden},
	} {
		t.Run(tc.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/v1/user/resetpassword", strings.NewReader(`{"user_id":8,"old_password":"old","new_password":"new"}`))
			request.Header.Set("Content-Type", "application/json")
			if tc.token != "" {
				request.Header.Set("Authorization", "Bearer "+tc.token)
			}
			response := httptest.NewRecorder()
			router.ServeHTTP(response, request)
			if response.Code != tc.status {
				t.Fatalf("status = %d, want %d: %s", response.Code, tc.status, response.Body.String())
			}
		})
	}
}
