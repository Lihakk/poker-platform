package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"

	"github.com/Lihakk/poker-backend/controllers"
	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()
	err := database.DB.AutoMigrate(
		&models.User{},
		&models.Profile{},
		&models.Module{},
		&models.Lesson{},
		&models.Quiz{},
		&models.Question{},
		&models.Option{},
		&models.HoldemScenario{},
		&models.ScenarioAction{},
		&models.UserProgress{},
		&models.UserScenarioHistory{},
	)

	if err != nil {
		log.Fatal("❌ Failed to migrate database:", err)
	}

	database.SeedData()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:5174",
			"http://127.0.0.1:5174",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Poker Backend is healthy!"})
	})

	// Auth
	r.POST("/api/register", controllers.Register)
	r.POST("/api/login", controllers.Login)

	// Content Routes
	r.GET("/api/modules", controllers.GetModules)
	r.GET("/api/lessons/:id", controllers.GetLesson)
	r.GET("/api/quizzes/:id", controllers.GetQuiz)
	r.GET("/api/scenarios", controllers.GetScenarios)
	r.GET("/api/scenarios/:id", controllers.GetScenario)

	r.Run(":8080")
}
