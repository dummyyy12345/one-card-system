package adminroutes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/SolomonAHailu/one-card-system/security"
	"github.com/gin-gonic/gin"
)

func TestRoleRoutesRejectNonAdmins(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("API_SECRET", "role-route-test-secret")
	studentToken, err := security.GenerateJwt(2, "registrar@example.com", 2)
	if err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	RegisterAdminRoleManagementRoutes(router)

	for _, route := range []struct{ method, path string }{
		{http.MethodPost, "/api/v1/admin/roles"},
		{http.MethodGet, "/api/v1/admin/roles"},
		{http.MethodGet, "/api/v1/admin/roles/1"},
		{http.MethodPatch, "/api/v1/admin/roles/1"},
		{http.MethodDelete, "/api/v1/admin/roles/1"},
	} {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			for _, tc := range []struct {
				name, token string
				status      int
			}{
				{"anonymous", "", http.StatusUnauthorized},
				{"malformed bearer", "WrongBearer " + studentToken, http.StatusUnauthorized},
				{"registrar", studentToken, http.StatusForbidden},
			} {
				t.Run(tc.name, func(t *testing.T) {
					request := httptest.NewRequest(route.method, route.path, nil)
					if tc.token != "" {
						if tc.name == "malformed bearer" {
							request.Header.Set("Authorization", tc.token)
						} else {
							request.Header.Set("Authorization", "Bearer "+tc.token)
						}
					}
					response := httptest.NewRecorder()
					router.ServeHTTP(response, request)
					if response.Code != tc.status {
						t.Fatalf("status = %d, want %d", response.Code, tc.status)
					}
				})
			}
		})
	}
}
