package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AccessClaims struct {
	Role    string `json:"role"`
	Version uint   `json:"version"`
	jwt.RegisteredClaims
}

func secret() ([]byte, error) {
	value := os.Getenv("JWT_SECRET")
	if len(value) < 32 {
		return nil, errors.New("JWT_SECRET must contain at least 32 characters")
	}
	return []byte(value), nil
}

func ValidateSecret() error {
	_, err := secret()
	return err
}

func GenerateToken(userID uint, role string, version uint) (string, error) {
	key, err := secret()
	if err != nil {
		return "", err
	}
	now := time.Now()
	claims := AccessClaims{Role: role, Version: version, RegisteredClaims: jwt.RegisteredClaims{
		Subject: strconv.FormatUint(uint64(userID), 10), Issuer: "pokerlearn",
		IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
	}}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(key)
}

func ParseToken(value string) (*AccessClaims, error) {
	key, err := secret()
	if err != nil {
		return nil, err
	}
	claims := &AccessClaims{}
	parsed, err := jwt.ParseWithClaims(value, claims, func(token *jwt.Token) (interface{}, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing algorithm")
		}
		return key, nil
	}, jwt.WithIssuer("pokerlearn"), jwt.WithExpirationRequired())
	if err != nil || !parsed.Valid {
		return nil, errors.New("invalid access token")
	}
	return claims, nil
}
