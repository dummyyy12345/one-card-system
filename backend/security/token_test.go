package security

import (
	"testing"

	"github.com/dgrijalva/jwt-go"
)

func TestJwtUsesCurrentSecret(t *testing.T) {
	t.Setenv("API_SECRET", "first-secret-loaded-after-package-initialization")
	token, err := GenerateJwt(7, "student@example.com", 2)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}
	claims, err := VerifyToken(token)
	if err != nil {
		t.Fatalf("verify token: %v", err)
	}
	if claims.UserId != 7 || claims.UserEmail != "student@example.com" || claims.UserRole != 2 {
		t.Fatalf("unexpected claims: %+v", claims)
	}

	t.Setenv("API_SECRET", "rotated-secret")
	if _, err := VerifyToken(token); err == nil {
		t.Fatal("token signed with previous secret should be rejected")
	}
}

func TestJwtRejectsMissingSecret(t *testing.T) {
	t.Setenv("API_SECRET", "")
	if _, err := GenerateJwt(1, "student@example.com", 1); err == nil {
		t.Fatal("generating a token without API_SECRET should fail")
	}
	if _, err := VerifyToken("any-token"); err == nil {
		t.Fatal("verifying a token without API_SECRET should fail")
	}
}

func TestJwtRejectsUnexpectedSigningMethod(t *testing.T) {
	secret := "secret-for-signing-method-test"
	t.Setenv("API_SECRET", secret)
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS384, &Claims{}).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign test token: %v", err)
	}
	if _, err := VerifyToken(token); err == nil {
		t.Fatal("HS384 token should be rejected")
	}
}
