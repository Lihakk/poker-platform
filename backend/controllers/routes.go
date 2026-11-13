package controllers

import "github.com/gin-gonic/gin"

// Production and integration tests use exactly the same endpoint registration.
func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/health", func(c *gin.Context) { c.JSON(200, gin.H{"message": "Poker Backend is healthy!"}) })
	r.POST("/api/register", Register)
	r.POST("/api/login", Login)
	r.POST("/api/refresh", Refresh)
	r.POST("/api/logout", Logout)
	content := r.Group("/api", RequireAuth)
	content.GET("/modules", GetModules)
	content.GET("/lessons/:id", GetLesson)
	content.GET("/quizzes/:id", GetQuiz)
	content.GET("/scenarios", GetScenarios)
	content.GET("/scenarios/:id", GetScenario)
	content.PUT("/users/:id/role", RequireAdmin, UpdateRole)
	v1 := r.Group("/api/v1", RequireAuth)
	v1.GET("/overview", LearningOverview)
	v1.GET("/modules", ListModules)
	v1.GET("/modules/:id", ReadModule)
	v1.POST("/modules", RequireEditor, CreateModule)
	v1.PUT("/modules/:id", RequireEditor, UpdateModule)
	v1.DELETE("/modules/:id", RequireEditor, DeleteModule)
	v1.GET("/quizzes", ListQuizzes)
	v1.GET("/quizzes/:id", ReadQuiz)
	v1.POST("/quizzes", RequireEditor, CreateQuiz)
	v1.PUT("/quizzes/:id", RequireEditor, UpdateQuiz)
	v1.DELETE("/quizzes/:id", RequireEditor, DeleteQuiz)
	v1.GET("/questions", ListQuestions)
	v1.GET("/questions/:id", ReadQuestion)
	v1.POST("/questions", RequireEditor, CreateQuestion)
	v1.PUT("/questions/:id", RequireEditor, UpdateQuestion)
	v1.DELETE("/questions/:id", RequireEditor, DeleteQuestion)
	v1.GET("/modules/:id/quizzes", ListQuizzes)
	v1.GET("/quizzes/:id/questions", ListQuestions)
	v1.GET("/modules/:id/quizzes/:quizId/questions", ListQuestions)
}
