package models

import (
	"time"
)

// User represents the main account
type User struct {
	ID           uint   `gorm:"primaryKey"`
	Username     string `gorm:"unique;not null"`
	Email        string `gorm:"unique;not null"`
	PasswordHash string `gorm:"not null"`
	Role         string `gorm:"type:varchar(20);not null;default:learner" json:"role"`
	TokenVersion uint   `gorm:"not null;default:0"`
	CreatedAt    time.Time

	// This tells GORM that a User "has one" Profile
	Profile Profile
}

type RefreshSession struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null;index"`
	TokenHash string    `gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	RevokedAt *time.Time
}

// Profile holds the user's learning stats
type Profile struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"uniqueIndex"` // This is the Foreign Key linking back to User
	XP     int  `gorm:"default:0"`   // Everyone starts with 0 XP
	Rank   int  `gorm:"default:1"`   // Everyone starts at Rank 1
}
