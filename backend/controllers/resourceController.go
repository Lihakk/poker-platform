package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func pathID(c *gin.Context, key string) (uint, bool) {
	parsed, err := strconv.ParseUint(c.Param(key), 10, 64)
	if err != nil || parsed == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid " + key})
		return 0, false
	}
	return uint(parsed), true
}

func pageParams(c *gin.Context) (int, int, bool) {
	page, err1 := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, err2 := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err1 != nil || err2 != nil || page < 1 || page > 1000000 || limit < 1 || limit > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "page must be 1-1000000; limit must be 1-100"})
		return 0, 0, false
	}
	return page, limit, true
}

func listResponse(c *gin.Context, data interface{}, total int64, page, limit int) {
	path := c.Request.URL.Path
	query := c.Request.URL.Query()
	link := func(target int) string {
		query.Set("page", strconv.Itoa(target))
		query.Set("limit", strconv.Itoa(limit))
		return path + "?" + query.Encode()
	}
	links := gin.H{"self": link(page)}
	if page > 1 {
		links["prev"] = link(page - 1)
	}
	if int64(page*limit) < total {
		links["next"] = link(page + 1)
	}
	c.JSON(http.StatusOK, gin.H{"data": data, "pagination": gin.H{"page": page, "limit": limit, "total": total}, "_links": links})
}

func resourceResponse(c *gin.Context, status int, kind string, id uint, data interface{}) {
	path := fmt.Sprintf("/api/v1/%s/%d", kind, id)
	links := gin.H{"self": path, "collection": "/api/v1/" + kind}
	if kind == "modules" {
		links["quizzes"] = path + "/quizzes"
	}
	if kind == "quizzes" {
		links["questions"] = path + "/questions"
	}
	c.JSON(status, gin.H{"data": data, "_links": links})
}

func dbError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Database operation failed"})
}

func canEditModule(c *gin.Context, module models.Module) bool {
	return c.GetString("role") == "admin" || (module.OwnerID != 0 && module.OwnerID == c.GetUint("userID"))
}

func ownedModule(c *gin.Context, moduleID uint) (models.Module, bool) {
	var module models.Module
	if err := database.DB.First(&module, moduleID).Error; err != nil {
		dbError(c, err)
		return module, false
	}
	if !canEditModule(c, module) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the module owner or administrator can edit this content"})
		return module, false
	}
	return module, true
}

func ListModules(c *gin.Context) {
	page, limit, ok := pageParams(c)
	if !ok {
		return
	}
	query := database.DB.Model(&models.Module{})
	if title := strings.TrimSpace(c.Query("title")); title != "" {
		query = query.Where("title LIKE ?", "%"+title+"%")
	}
	var total int64
	var items []models.Module
	if err := query.Count(&total).Error; err != nil {
		dbError(c, err)
		return
	}
	if err := query.Order("display_order asc, id asc").Offset((page - 1) * limit).Limit(limit).Find(&items).Error; err != nil {
		dbError(c, err)
		return
	}
	listResponse(c, items, total, page, limit)
}

func ReadModule(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	var module models.Module
	if err := database.DB.Preload("Lessons").Preload("Quizzes").First(&module, id).Error; err != nil {
		dbError(c, err)
		return
	}
	resourceResponse(c, http.StatusOK, "modules", id, module)
}

type moduleInput struct {
	Title        string `json:"title" binding:"required,min=3,max=200"`
	Description  string `json:"description" binding:"required,min=10"`
	DisplayOrder int    `json:"display_order"`
}

func CreateModule(c *gin.Context) {
	var body moduleInput
	if err := c.ShouldBindJSON(&body); err != nil || !body.valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Use a 3-200 character title, 10-6000 character description and display order 0-1000000"})
		return
	}
	module := models.Module{Title: strings.TrimSpace(body.Title), Description: strings.TrimSpace(body.Description), DisplayOrder: body.DisplayOrder, OwnerID: c.GetUint("userID")}
	if err := database.DB.Create(&module).Error; err != nil {
		dbError(c, err)
		return
	}
	c.Header("Location", fmt.Sprintf("/api/v1/modules/%d", module.ID))
	resourceResponse(c, http.StatusCreated, "modules", module.ID, module)
}

func UpdateModule(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	if _, ok = ownedModule(c, id); !ok {
		return
	}
	var body moduleInput
	if err := c.ShouldBindJSON(&body); err != nil || !body.valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Use a 3-200 character title, 10-6000 character description and display order 0-1000000"})
		return
	}
	updates := map[string]interface{}{"title": strings.TrimSpace(body.Title), "description": strings.TrimSpace(body.Description), "display_order": body.DisplayOrder}
	if err := database.DB.Model(&models.Module{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		dbError(c, err)
		return
	}
	ReadModule(c)
}

func DeleteModule(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	if _, ok = ownedModule(c, id); !ok {
		return
	}
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var quizIDs []uint
		if err := tx.Model(&models.Quiz{}).Where("module_id = ?", id).Pluck("id", &quizIDs).Error; err != nil {
			return err
		}
		if len(quizIDs) > 0 {
			var questionIDs []uint
			if err := tx.Model(&models.Question{}).Where("quiz_id IN ?", quizIDs).Pluck("id", &questionIDs).Error; err != nil {
				return err
			}
			if len(questionIDs) > 0 {
				if err := tx.Where("question_id IN ?", questionIDs).Delete(&models.Option{}).Error; err != nil {
					return err
				}
			}
			if err := tx.Where("quiz_id IN ?", quizIDs).Delete(&models.Question{}).Error; err != nil {
				return err
			}
			if err := tx.Where("module_id = ?", id).Delete(&models.Quiz{}).Error; err != nil {
				return err
			}
		}
		var lessonIDs []uint
		if err := tx.Model(&models.Lesson{}).Where("module_id = ?", id).Pluck("id", &lessonIDs).Error; err != nil {
			return err
		}
		if len(lessonIDs) > 0 {
			if err := tx.Where("lesson_id IN ?", lessonIDs).Delete(&models.UserProgress{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("module_id = ?", id).Delete(&models.Lesson{}).Error; err != nil {
			return err
		}
		var scenarioIDs []uint
		if err := tx.Model(&models.HoldemScenario{}).Where("module_id = ?", id).Pluck("id", &scenarioIDs).Error; err != nil {
			return err
		}
		if len(scenarioIDs) > 0 {
			if err := tx.Where("scenario_id IN ?", scenarioIDs).Delete(&models.UserScenarioHistory{}).Error; err != nil {
				return err
			}
			if err := tx.Where("scenario_id IN ?", scenarioIDs).Delete(&models.ScenarioAction{}).Error; err != nil {
				return err
			}
			if err := tx.Where("module_id = ?", id).Delete(&models.HoldemScenario{}).Error; err != nil {
				return err
			}
		}
		return tx.Delete(&models.Module{}, id).Error
	})
	if err != nil {
		dbError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func ListQuizzes(c *gin.Context) {
	page, limit, ok := pageParams(c)
	if !ok {
		return
	}
	query := database.DB.Model(&models.Quiz{})
	if strings.HasPrefix(c.FullPath(), "/api/v1/modules/:id/") {
		moduleID, valid := pathID(c, "id")
		if !valid {
			return
		}
		if database.DB.First(&models.Module{}, moduleID).Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
			return
		}
		query = query.Where("module_id = ?", moduleID)
	}
	if raw := c.Query("module_id"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module_id"})
			return
		}
		query = query.Where("module_id = ?", id)
	}
	if title := strings.TrimSpace(c.Query("title")); title != "" {
		query = query.Where("title LIKE ?", "%"+title+"%")
	}
	var total int64
	var items []models.Quiz
	if err := query.Count(&total).Error; err != nil {
		dbError(c, err)
		return
	}
	if err := query.Order("id asc").Offset((page - 1) * limit).Limit(limit).Find(&items).Error; err != nil {
		dbError(c, err)
		return
	}
	listResponse(c, items, total, page, limit)
}

func ReadQuiz(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	var quiz models.Quiz
	if err := database.DB.Preload("Questions.Options").First(&quiz, id).Error; err != nil {
		dbError(c, err)
		return
	}
	resourceResponse(c, http.StatusOK, "quizzes", id, quiz)
}

type quizInput struct {
	ModuleID uint   `json:"module_id" binding:"required"`
	Title    string `json:"title" binding:"required,min=3,max=200"`
}

func CreateQuiz(c *gin.Context) {
	var body quizInput
	if err := c.ShouldBindJSON(&body); err != nil || !body.valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Module and title are required"})
		return
	}
	if _, ok := ownedModule(c, body.ModuleID); !ok {
		return
	}
	quiz := models.Quiz{ModuleID: body.ModuleID, Title: strings.TrimSpace(body.Title)}
	if err := database.DB.Create(&quiz).Error; err != nil {
		dbError(c, err)
		return
	}
	c.Header("Location", fmt.Sprintf("/api/v1/quizzes/%d", quiz.ID))
	resourceResponse(c, http.StatusCreated, "quizzes", quiz.ID, quiz)
}

func ownedQuiz(c *gin.Context, id uint) (models.Quiz, bool) {
	var quiz models.Quiz
	if err := database.DB.First(&quiz, id).Error; err != nil {
		dbError(c, err)
		return quiz, false
	}
	_, ok := ownedModule(c, quiz.ModuleID)
	return quiz, ok
}

func UpdateQuiz(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	if _, ok = ownedQuiz(c, id); !ok {
		return
	}
	var body quizInput
	if err := c.ShouldBindJSON(&body); err != nil || !body.valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Module and title are required"})
		return
	}
	if _, ok = ownedModule(c, body.ModuleID); !ok {
		return
	}
	if err := database.DB.Model(&models.Quiz{}).Where("id = ?", id).Updates(map[string]interface{}{"module_id": body.ModuleID, "title": strings.TrimSpace(body.Title)}).Error; err != nil {
		dbError(c, err)
		return
	}
	ReadQuiz(c)
}

func DeleteQuiz(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	if _, ok = ownedQuiz(c, id); !ok {
		return
	}
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var questionIDs []uint
		if err := tx.Model(&models.Question{}).Where("quiz_id = ?", id).Pluck("id", &questionIDs).Error; err != nil {
			return err
		}
		if len(questionIDs) > 0 {
			if err := tx.Where("question_id IN ?", questionIDs).Delete(&models.Option{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("quiz_id = ?", id).Delete(&models.Question{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Quiz{}, id).Error
	})
	if err != nil {
		dbError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func ListQuestions(c *gin.Context) {
	page, limit, ok := pageParams(c)
	if !ok {
		return
	}
	query := database.DB.Model(&models.Question{})
	if raw := c.Query("module_id"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module_id"})
			return
		}
		query = query.Where("quiz_id IN (?)", database.DB.Model(&models.Quiz{}).Select("id").Where("module_id = ?", id))
	}
	var quizID uint
	if strings.HasPrefix(c.FullPath(), "/api/v1/modules/:id/") {
		moduleID, valid := pathID(c, "id")
		if !valid {
			return
		}
		if database.DB.First(&models.Module{}, moduleID).Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
			return
		}
		id, valid := pathID(c, "quizId")
		if !valid {
			return
		}
		quizID = id
		var quiz models.Quiz
		if database.DB.Where("id = ? AND module_id = ?", quizID, moduleID).First(&quiz).Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found in module"})
			return
		}
	} else if strings.HasPrefix(c.FullPath(), "/api/v1/quizzes/:id/") {
		id, valid := pathID(c, "id")
		if !valid {
			return
		}
		quizID = id
	} else if raw := c.Query("quiz_id"); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz_id"})
			return
		}
		quizID = uint(id)
	}
	if quizID != 0 {
		if database.DB.First(&models.Quiz{}, quizID).Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
			return
		}
		query = query.Where("quiz_id = ?", quizID)
	}
	if text := strings.TrimSpace(c.Query("text")); text != "" {
		query = query.Where("text LIKE ?", "%"+text+"%")
	}
	var total int64
	var items []models.Question
	if err := query.Count(&total).Error; err != nil {
		dbError(c, err)
		return
	}
	if err := query.Preload("Options").Order("id asc").Offset((page - 1) * limit).Limit(limit).Find(&items).Error; err != nil {
		dbError(c, err)
		return
	}
	listResponse(c, items, total, page, limit)
}

func ReadQuestion(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	var question models.Question
	if err := database.DB.Preload("Options").First(&question, id).Error; err != nil {
		dbError(c, err)
		return
	}
	resourceResponse(c, http.StatusOK, "questions", id, question)
}

type optionInput struct {
	Text      string `json:"text" binding:"required"`
	IsCorrect bool   `json:"is_correct"`
}
type questionInput struct {
	QuizID      uint          `json:"quiz_id" binding:"required"`
	Text        string        `json:"text" binding:"required,min=8"`
	Explanation string        `json:"explanation" binding:"max=5000"`
	Options     []optionInput `json:"options" binding:"required,min=2,dive"`
}

func validOptions(options []optionInput) bool {
	correct := 0
	for _, option := range options {
		if strings.TrimSpace(option.Text) == "" {
			return false
		}
		if option.IsCorrect {
			correct++
		}
	}
	return correct == 1
}

func CreateQuestion(c *gin.Context) {
	var body questionInput
	if err := c.ShouldBindJSON(&body); err != nil || !body.valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Use 8-5000 characters, 2-8 distinct answers of 1-200 characters and exactly one correct answer"})
		return
	}
	if _, ok := ownedQuiz(c, body.QuizID); !ok {
		return
	}
	question := models.Question{QuizID: body.QuizID, Text: strings.TrimSpace(body.Text), Explanation: strings.TrimSpace(body.Explanation)}
	for _, option := range body.Options {
		question.Options = append(question.Options, models.Option{Text: strings.TrimSpace(option.Text), IsCorrect: option.IsCorrect})
	}
	if err := database.DB.Create(&question).Error; err != nil {
		dbError(c, err)
		return
	}
	c.Header("Location", fmt.Sprintf("/api/v1/questions/%d", question.ID))
	resourceResponse(c, http.StatusCreated, "questions", question.ID, question)
}

func ownedQuestion(c *gin.Context, id uint) (models.Question, bool) {
	var question models.Question
	if err := database.DB.First(&question, id).Error; err != nil {
		dbError(c, err)
		return question, false
	}
	_, ok := ownedQuiz(c, question.QuizID)
	return question, ok
}

func UpdateQuestion(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	if _, ok = ownedQuestion(c, id); !ok {
		return
	}
	var body questionInput
	if err := c.ShouldBindJSON(&body); err != nil || !body.valid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Use 8-5000 characters, 2-8 distinct answers of 1-200 characters and exactly one correct answer"})
		return
	}
	if _, ok = ownedQuiz(c, body.QuizID); !ok {
		return
	}
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Question{}).Where("id = ?", id).Updates(map[string]interface{}{"quiz_id": body.QuizID, "text": strings.TrimSpace(body.Text), "explanation": strings.TrimSpace(body.Explanation)}).Error; err != nil {
			return err
		}
		if err := tx.Where("question_id = ?", id).Delete(&models.Option{}).Error; err != nil {
			return err
		}
		for _, option := range body.Options {
			if err := tx.Create(&models.Option{QuestionID: id, Text: strings.TrimSpace(option.Text), IsCorrect: option.IsCorrect}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		dbError(c, err)
		return
	}
	ReadQuestion(c)
}

func DeleteQuestion(c *gin.Context) {
	id, ok := pathID(c, "id")
	if !ok {
		return
	}
	if _, ok = ownedQuestion(c, id); !ok {
		return
	}
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("question_id = ?", id).Delete(&models.Option{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.Question{}, id).Error
	})
	if err != nil {
		dbError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func LearningOverview(c *gin.Context) {
	var modules, quizzes, questions int64
	if err := database.DB.Model(&models.Module{}).Count(&modules).Error; err != nil {
		dbError(c, err)
		return
	}
	if err := database.DB.Model(&models.Quiz{}).Count(&quizzes).Error; err != nil {
		dbError(c, err)
		return
	}
	if err := database.DB.Model(&models.Question{}).Count(&questions).Error; err != nil {
		dbError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"modules": modules, "quizzes": quizzes, "questions": questions, "_links": gin.H{"modules": "/api/v1/modules", "quizzes": "/api/v1/quizzes", "questions": "/api/v1/questions"}})
}
