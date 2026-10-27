package registrarcontrollers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestUpdateStudentManuallyRejectsInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, test := range []struct {
		name string
		body string
		row  bool
	}{
		{"malformed JSON", `{"student_id":`, false},
		{"missing student", `{}`, false},
		{"invalid fields", `{}`, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := mockedStudentDB(t)
			if test.name != "malformed JSON" {
				rows := sqlmock.NewRows([]string{"id", "student_id"})
				if test.row {
					rows.AddRow(7, "ST7")
				}
				mock.ExpectQuery(`SELECT \* FROM "students"`).WillReturnRows(rows)
			}
			router := gin.New()
			router.PATCH("/students/:id", func(c *gin.Context) { UpdateStudentManually(c, db) })
			response := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPatch, "/students/7", strings.NewReader(test.body))
			request.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(response, request)
			want := http.StatusBadRequest
			if test.name == "missing student" {
				want = http.StatusNotFound
			}
			if response.Code != want {
				t.Fatalf("status=%d, want=%d: %s", response.Code, want, response.Body.String())
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
