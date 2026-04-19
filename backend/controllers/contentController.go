package controllers

import (
	"net/http"

	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/gin-gonic/gin"
)

func GetModules(c *gin.Context) {
	var modules []models.Module

	err := database.DB.Preload("Lessons").Preload("Quizzes").Find(&modules).Error

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
