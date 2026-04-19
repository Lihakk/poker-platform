package models

import "time"

type UserProgress struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null"`
	LessonID    uint      `gorm:"not null"`
	CompletedAt time.Time `gorm:"autoCreateTime"` // Automatically sets to current time
}

type UserScenarioHistory struct {
	ID             uint      `gorm:"primaryKey"`
	UserID         uint      `gorm:"not null"`
	ScenarioID     uint      `gorm:"not null"`
	ActionChosenID uint      `gorm:"not null"`
	WasOptimal     bool      `gorm:"not null"`
	PlayedAt       time.Time `gorm:"autoCreateTime"`
}
