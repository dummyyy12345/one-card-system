package registrarcontrollers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func mockedStudentDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock) {
	t.Helper()
	connection, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { connection.Close() })
	db, err := gorm.Open(postgres.New(postgres.Config{Conn: connection}), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	return db, mock
}

func TestGetStudentsPaginationAndErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, test := range []struct {
		name       string
		url        string
		count      int64
		countErr   error
		wantStatus int
		wantPage   float64
	}{
		{"defaults invalid pagination", "/students?page=bad&limit=-1", 1, nil, http.StatusOK, 1},
		{"uses requested page", "/students?page=2&limit=1&status=Active", 2, nil, http.StatusOK, 2},
		{"reports database error", "/students", 0, errors.New("database unavailable"), http.StatusInternalServerError, 0},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := mockedStudentDB(t)
			count := mock.ExpectQuery(`SELECT count\(\*\) FROM "students"`)
			if test.countErr != nil {
				count.WillReturnError(test.countErr)
			} else {
				count.WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(test.count))
				mock.ExpectQuery(`SELECT \* FROM "students"`).WillReturnRows(
					sqlmock.NewRows([]string{"id", "student_id", "first_name"}).AddRow(7, "ST7", "Ada"),
				)
			}
			router := gin.New()
			router.GET("/students", func(c *gin.Context) { GetStudents(c, db) })
			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, test.url, nil))
			if response.Code != test.wantStatus {
				t.Fatalf("status=%d, want=%d, body=%s", response.Code, test.wantStatus, response.Body.String())
			}
			if test.wantStatus == http.StatusOK {
				var body map[string]any
				if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
					t.Fatal(err)
				}
				if body["currentPage"] != test.wantPage || body["totalStudents"] != float64(test.count) {
					t.Fatalf("unexpected pagination: %v", body)
				}
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestGetStudentByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, test := range []struct {
		name       string
		row        bool
		queryErr   error
		wantStatus int
	}{
		{"found", true, nil, http.StatusOK},
		{"not found", false, nil, http.StatusNotFound},
		{"database error", false, errors.New("database unavailable"), http.StatusInternalServerError},
	} {
		t.Run(test.name, func(t *testing.T) {
			db, mock := mockedStudentDB(t)
			query := mock.ExpectQuery(`SELECT \* FROM "students"`)
			if test.queryErr != nil {
				query.WillReturnError(test.queryErr)
			} else {
				rows := sqlmock.NewRows([]string{"id", "student_id", "first_name"})
				if test.row {
					rows.AddRow(7, "ST7", "Ada")
				}
				query.WillReturnRows(rows)
			}
			router := gin.New()
			router.GET("/students/:id", func(c *gin.Context) { GetStudentById(c, db) })
			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/students/7", nil))
			if response.Code != test.wantStatus {
				t.Fatalf("status=%d, want=%d, body=%s", response.Code, test.wantStatus, response.Body.String())
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
