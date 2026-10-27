package security

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
)

type Claims struct {
	UserId    uint   `json:"id"`
	UserEmail string `json:"email"`
	UserRole  int    `json:"role_id"`
	jwt.StandardClaims
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
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
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
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return key, nil
	})
	if err != nil {
		return nil, err
	}
	if token == nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
