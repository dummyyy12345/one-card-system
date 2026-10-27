package registrarcontrollers

import (
	"testing"
	"time"

	"github.com/SolomonAHailu/one-card-system/models/registrarmodels"
)

func TestShouldUpdateStudentDetectsMeaningfulChanges(t *testing.T) {
	date := time.Date(2000, time.January, 2, 0, 0, 0, 0, time.UTC)
	current := registrarmodels.Student{
		FirstName:   "Ada",
		DateOfBirth: date,
		Status:      registrarmodels.StatusActive,
	}
	if shouldUpdateStudent(current, current) {
		t.Fatal("unchanged student should not be synchronized")
	}
	changedName := current
	changedName.FirstName = "Grace"
	if !shouldUpdateStudent(current, changedName) {
		t.Fatal("name change should be synchronized")
	}
	changedDate := current
	changedDate.DateOfBirth = date.AddDate(0, 0, 1)
	if !shouldUpdateStudent(current, changedDate) {
		t.Fatal("birth-date change should be synchronized")
	}
	changedStatus := current
	changedStatus.Status = registrarmodels.StatusInactive
	if !shouldUpdateStudent(current, changedStatus) {
		t.Fatal("status change should be synchronized")
	}
}

func TestParseDateUsesStudentSourceFormat(t *testing.T) {
	want := time.Date(2000, time.January, 2, 0, 0, 0, 0, time.UTC)
	if got := parseDate("2000-01-02"); !got.Equal(want) {
		t.Fatalf("parsed date = %v, want %v", got, want)
	}
	if got := parseDate("not-a-date"); !got.IsZero() {
		t.Fatalf("invalid source date should return zero time, got %v", got)
	}
}
