package registrarcontrollers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFetchStudentsFromSource(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-token" {
			t.Error("missing source token")
		}
		w.Write([]byte(`{"students":[{"student_id":"ST1","first_name":"Ada","father_name":"A","grand_father_name":"B","email":"ada@example.com","phone":"0982010311","sex":"Female","date_of_birth":"2000-01-02","program":"Science","section":"A","year":1,"semester":1,"registered_date":"2026-01-01","status":"Active"}]}`))
	}))
	defer server.Close()
	students, err := fetchStudentsFromSource(context.Background(), server.Client(), server.URL, "test-token")
	if err != nil || len(students) != 1 || students[0].StudentID != "ST1" || students[0].DateOfBirth.IsZero() {
		t.Fatalf("students=%+v, err=%v", students, err)
	}
}

func TestFetchStudentsFromSourceRejectsInvalidInput(t *testing.T) {
	for _, body := range []string{
		`{}`,
		`{"students":[{"student_id":"ST1","date_of_birth":"invalid","registered_date":"2026-01-01","status":"Active"}]}`,
		`{"students":[{"student_id":"ST1","date_of_birth":"2000-01-01","registered_date":"2026-01-01","status":"Active"},{"student_id":"ST1","date_of_birth":"2000-01-01","registered_date":"2026-01-01","status":"Active"}]}`,
	} {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(body)) }))
		_, err := fetchStudentsFromSource(context.Background(), server.Client(), server.URL, "")
		server.Close()
		if err == nil {
			t.Fatalf("expected rejection for %s", body)
		}
	}
	if _, err := fetchStudentsFromSource(context.Background(), http.DefaultClient, "not-a-url", ""); err == nil || !strings.Contains(err.Error(), "SERVICE") {
		t.Fatalf("invalid SERVICE URL should fail: %v", err)
	}
}
