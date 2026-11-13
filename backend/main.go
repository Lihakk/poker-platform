package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"

	"github.com/Lihakk/poker-backend/controllers"
	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/Lihakk/poker-backend/utils"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := utils.ValidateSecret(); err != nil {
		log.Fatal(err)
	}
	database.Connect()
	err := database.DB.AutoMigrate(
		&models.User{},
		&models.RefreshSession{},
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
	if err := database.UpgradeLearningContent(); err != nil {
		log.Fatal("Failed to upgrade learning content: ", err)
	}
	if email := strings.TrimSpace(os.Getenv("ADMIN_EMAIL")); email != "" {
		result := database.DB.Model(&models.User{}).Where("email = ?", strings.ToLower(email)).Update("role", "admin")
		if result.Error != nil {
			log.Fatal(result.Error)
		}
		if result.RowsAffected == 0 {
			log.Printf("ADMIN_EMAIL %q has no registered account yet", email)
		}
	}

	r := gin.Default()
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Fatal(err)
	}
	r.HandleMethodNotAllowed = true
	r.NoRoute(func(c *gin.Context) { c.JSON(http.StatusNotFound, gin.H{"error": "Route not found"}) })
	r.NoMethod(func(c *gin.Context) { c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method not allowed"}) })

	origins := []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"}
	if configured := os.Getenv("CORS_ORIGINS"); configured != "" {
		origins = strings.Split(configured, ",")
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	controllers.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	host := os.Getenv("HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	log.Fatal(r.Run(host + ":" + port))
}
