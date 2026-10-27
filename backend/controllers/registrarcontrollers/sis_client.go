package registrarcontrollers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

const maxStudentResponseBytes = 5 << 20

// The source contract is {"students":[{student_id, first_name, ..., date_of_birth,
// registered_date, status}]}; dates use YYYY-MM-DD. Extra fields are ignored.
type sourceStudent struct {
	StudentID       string                     `json:"student_id"`
	FirstName       string                     `json:"first_name"`
	FatherName      string                     `json:"father_name"`
	GrandFatherName string                     `json:"grand_father_name"`
	Email           string                     `json:"email"`
	Phone           string                     `json:"phone"`
	Sex             registrarmodels.SexType    `json:"sex"`
	DateOfBirth     string                     `json:"date_of_birth"`
	Program         string                     `json:"program"`
	Section         string                     `json:"section"`
	Year            int                        `json:"year"`
	Semester        int                        `json:"semester"`
	Religion        string                     `json:"religion"`
	RegisteredDate  string                     `json:"registered_date"`
	Status          registrarmodels.StatusType `json:"status"`
}

func fetchStudentDataFromSMS() ([]registrarmodels.Student, error) {
	return fetchStudentsFromSource(context.Background(), &http.Client{Timeout: 10 * time.Second}, os.Getenv("SERVICE"), os.Getenv("SERVICE_TOKEN"))
}

func fetchStudentsFromSource(ctx context.Context, client *http.Client, endpoint, token string) ([]registrarmodels.Student, error) {
	u, err := url.Parse(endpoint)
	if err != nil || u.Host == "" || (u.Scheme != "https" && u.Scheme != "http") {
		return nil, errors.New("SERVICE must be an absolute HTTP(S) URL")
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("create student source request: %w", err)
	}
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}
	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("fetch student source: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("student source returned HTTP %d", response.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, maxStudentResponseBytes+1))
	if err != nil {
		return nil, fmt.Errorf("read student source: %w", err)
	}
	if len(data) > maxStudentResponseBytes {
		return nil, errors.New("student source response exceeds 5 MiB")
	}
	var payload struct {
		Students []sourceStudent `json:"students"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil, fmt.Errorf("decode student source: %w", err)
	}
	if payload.Students == nil {
		return nil, errors.New("student source response must contain students array")
	}
	students := make([]registrarmodels.Student, 0, len(payload.Students))
	seen := make(map[string]bool, len(payload.Students))
	for index, item := range payload.Students {
		birth, birthErr := time.Parse("2006-01-02", item.DateOfBirth)
		registered, registeredErr := time.Parse("2006-01-02", item.RegisteredDate)
		if item.StudentID == "" || birthErr != nil || registeredErr != nil ||
			(item.Status != registrarmodels.StatusActive && item.Status != registrarmodels.StatusInactive) ||
			seen[item.StudentID] {
			return nil, fmt.Errorf("invalid student source record at index %d", index)
		}
		seen[item.StudentID] = true
		students = append(students, registrarmodels.Student{
			StudentID: item.StudentID, FirstName: item.FirstName, FatherName: item.FatherName,
			GrandFatherName: item.GrandFatherName, Email: item.Email, Phone: item.Phone,
			Sex: item.Sex, DateOfBirth: birth, Program: item.Program, Section: item.Section,
			Year: item.Year, Semester: item.Semester, Religion: item.Religion,
			RegisteredDate: registered, Status: item.Status,
		})
	}
	return students, nil
}
