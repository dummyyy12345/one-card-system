package accesscontrollers

import "testing"

func TestRoleCanAccessOnlyItsLocation(t *testing.T) {
	for _, tc := range []struct {
		role, location string
		allowed        bool
	}{
		{"Admin", "library", true},
		{"Gate", "gate", true},
		{"Gate", "library", false},
		{"Cafeteria", "cafeteria", true},
		{"Dormitory", "dormitory", true},
		{"Librarian", "library", true},
		{"Registrar", "gate", false},
	} {
		if roleCanAccess(tc.role, tc.location) != tc.allowed {
			t.Errorf("role %q at %q: want %t", tc.role, tc.location, tc.allowed)
		}
	}
}
