package database

import (
	"log"

	"github.com/Lihakk/poker-backend/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := "root:linjan9@tcp(127.0.0.1:3306)/poker_db?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to the database! \n", err)
	}

	log.Println("✅ Successfully connected to MariaDB!")

	DB = db
}
func SeedData() {
	var count int64
	DB.Model(&models.Module{}).Count(&count)
	if count > 0 {
		return // Database already has data
	}

	// Create a Poker Module
	module := models.Module{
		Title:       "Poker 101: The Basics",
		Description: "Learn hand rankings and position strategy.",
	}
	DB.Create(&module)

	lesson := models.Lesson{
		ModuleID: module.ID,
		Title:    "The Importance of Position",
		Content:  "In Texas Hold'em, position is everything. Being the 'Button' means you act last...",
	}
	DB.Create(&lesson)

	quiz := models.Quiz{
		ModuleID: module.ID,
		Title:    "Position Basics Quiz",
	}
	DB.Create(&quiz)
	question := models.Question{
		QuizID: quiz.ID,
		Text:   "Where should you act last in a hand of Texas Hold'em?",
	}
	DB.Create(&question)

	DB.Create(&models.Option{QuestionID: question.ID, Text: "The Big Blind", IsCorrect: false})
	DB.Create(&models.Option{QuestionID: question.ID, Text: "The Button", IsCorrect: true})
	DB.Create(&models.Option{QuestionID: question.ID, Text: "Under the Gun", IsCorrect: false})

	log.Println("🌱 Database seeded with initial learning content!")
}
