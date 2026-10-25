package registrarcontrollers

import (
	"net/http"
	"testing"
)

func TestCreateStudentRejectsMalformedJSONBeforeDatabaseAccess(t *testing.T) {
	c, recorder := studentUpdateRequest(t, `{"student_id":`)
	CreateStudentManually(c, nil)
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400: %s", recorder.Code, recorder.Body.String())
	}
}

func TestCreateStudentRejectsMissingRequiredFieldsBeforeDatabaseAccess(t *testing.T) {
	c, recorder := studentUpdateRequest(t, `{}`)
	CreateStudentManually(c, nil)
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400: %s", recorder.Code, recorder.Body.String())
	}
}
