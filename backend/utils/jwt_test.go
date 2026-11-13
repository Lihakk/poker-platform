package utils

import (
	"strings"
	"testing"
)

func TestAccessTokenClaimsAndTampering(t *testing.T) {
	t.Setenv("JWT_SECRET", strings.Repeat("s", 40))
	value, err := GenerateToken(42, "editor", 3)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := ParseToken(value)
	if err != nil {
		t.Fatal(err)
	}
	if claims.Subject != "42" || claims.Role != "editor" || claims.Version != 3 {
		t.Fatalf("unexpected claims: %+v", claims)
	}
	parts := strings.Split(value, ".")
	parts[1] = parts[1] + "x"
	if _, err := ParseToken(strings.Join(parts, ".")); err == nil {
		t.Fatal("tampered token was accepted")
	}
}

func TestSecretRequired(t *testing.T) {
	t.Setenv("JWT_SECRET", "short")
	if _, err := GenerateToken(1, "learner", 0); err == nil {
		t.Fatal("short secret was accepted")
	}
}
