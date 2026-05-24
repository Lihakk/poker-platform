package controllers

import (
	"net/http"

	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/gin-gonic/gin"
)

func GetModules(c *gin.Context) {
	var modules []models.Module

	err := database.DB.
		Preload("Lessons").
		Preload("Quizzes").
		Preload("Scenarios.Actions").
		Order("display_order asc, id asc").
		Find(&modules).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch content"})
		return
	}

	c.JSON(http.StatusOK, modules)
}
func GetLesson(c *gin.Context) {
	id := c.Param("id")
	var lesson models.Lesson
	if err := database.DB.First(&lesson, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
		return
	}
	c.JSON(http.StatusOK, lesson)
}
func GetQuiz(c *gin.Context) {
	id := c.Param("id")
	var quiz models.Quiz
	if err := database.DB.Preload("Questions.Options").First(&quiz, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
		return
	}
	c.JSON(http.StatusOK, quiz)
}

func GetScenarios(c *gin.Context) {
	var scenarios []models.HoldemScenario

	if err := database.DB.Preload("Actions").Order("id asc").Find(&scenarios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch scenarios"})
		return
	}

	c.JSON(http.StatusOK, scenarios)
}

func GetScenario(c *gin.Context) {
	id := c.Param("id")
	var scenario models.HoldemScenario

	if err := database.DB.Preload("Actions").First(&scenario, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scenario not found"})
		return
	}

	c.JSON(http.StatusOK, scenario)
}
