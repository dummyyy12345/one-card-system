package security

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserId    uint   `json:"id"`
	UserEmail string `json:"email"`
	UserRole  int    `json:"role_id"`
	jwt.RegisteredClaims
}

func signingKey() ([]byte, error) {
	secret := os.Getenv("API_SECRET")
	if secret == "" {
		return nil, errors.New("API_SECRET is required")
	}
	return []byte(secret), nil
}

func GenerateJwt(userId uint, userEmail string, userRole int) (string, error) {
	key, err := signingKey()
	if err != nil {
		return "", err
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserId:    userId,
		UserEmail: userEmail,
		UserRole:  userRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(key)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func VerifyToken(tokenString string) (*Claims, error) {
	key, err := signingKey()
	if err != nil {
		return nil, err
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return key, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
	if err != nil {
		return nil, err
	}
	if token == nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
