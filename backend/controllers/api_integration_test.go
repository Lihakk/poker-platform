package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/Lihakk/poker-backend/database"
	"github.com/Lihakk/poker-backend/models"
	"github.com/Lihakk/poker-backend/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// All writes are isolated in uniquely prefixed tables, which are dropped on exit.
func TestAPICriteria(t *testing.T) {
	dsn := os.Getenv("POKER_TEST_DSN")
	if dsn == "" {
		t.Skip("Set POKER_TEST_DSN for isolated MariaDB API integration tests")
	}
	t.Setenv("JWT_SECRET", "integration-test-key-not-a-production-secret-2026")
	t.Setenv("COOKIE_SECURE", "true")
	prefix := fmt.Sprintf("crit_%x_", time.Now().UnixNano())
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{NamingStrategy: schema.NamingStrategy{TablePrefix: prefix, IdentifierMaxLength: 64}, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	previous := database.DB
	database.DB = db
	tables := []interface{}{&models.User{}, &models.RefreshSession{}, &models.Profile{}, &models.Module{}, &models.Lesson{}, &models.Quiz{}, &models.Question{}, &models.Option{}, &models.HoldemScenario{}, &models.ScenarioAction{}, &models.UserProgress{}, &models.UserScenarioHistory{}}
	t.Cleanup(func() {
		for i := len(tables) - 1; i >= 0; i-- {
			if err := db.Migrator().DropTable(tables[i]); err != nil {
				t.Errorf("Drop isolated test table: %v", err)
			}
		}
		database.DB = previous
		if connection, err := db.DB(); err == nil {
			_ = connection.Close()
		}
	})
	if err := db.AutoMigrate(tables...); err != nil {
		t.Fatal(err)
	}
	password, _ := bcrypt.GenerateFromPassword([]byte("test-password-2026"), bcrypt.MinCost)
	actors := make(map[string]models.User)
	tokens := make(map[string]string)
	for _, name := range []string{"owner", "other", "learner", "admin"} {
		role := "editor"
		if name == "learner" || name == "admin" {
			role = name
		}
		user := models.User{Username: name, Email: name + "@example.test", PasswordHash: string(password), Role: role}
		if err := db.Create(&user).Error; err != nil {
			t.Fatal(err)
		}
		actors[name] = user
		tokens[name], err = utils.GenerateToken(user.ID, role, 0)
		if err != nil {
			t.Fatal(err)
		}
	}
	for i := 1; i <= 5; i++ {
		module := models.Module{Title: fmt.Sprintf("Foundation %d", i), Description: "Meaningful poker learning material", OwnerID: actors["owner"].ID}
		if err := db.Create(&module).Error; err != nil {
			t.Fatal(err)
		}
		quiz := models.Quiz{ModuleID: module.ID, Title: fmt.Sprintf("Position quiz %d", i)}
		if err := db.Create(&quiz).Error; err != nil {
			t.Fatal(err)
		}
		question := models.Question{QuizID: quiz.ID, Text: "Which player acts last after the flop?", Explanation: "The button has postflop position.", Options: []models.Option{{Text: "Button", IsCorrect: true}, {Text: "Small blind"}}}
		if err := db.Create(&question).Error; err != nil {
			t.Fatal(err)
		}
	}
	lesson := models.Lesson{ModuleID: 1, Title: "Position", Content: "Acting last provides more information."}
	scenario := models.HoldemScenario{ModuleID: 1, Title: "Button open", HeroPosition: "BTN", HoleCards: "AsKh", PotSize: 1.5, StackSize: 100, FacingBet: 1, Street: "Preflop"}
	if err := db.Create(&lesson).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&scenario).Error; err != nil {
		t.Fatal(err)
	}
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(gin.Recovery())
	covered := make(map[string]bool)
	router.Use(func(c *gin.Context) { c.Next(); covered[c.Request.Method+" "+c.FullPath()] = true })
	RegisterRoutes(router)
	call := func(method, path string, body interface{}, token string, cookie *http.Cookie, expected int) *httptest.ResponseRecorder {
		t.Helper()
		data, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		request := httptest.NewRequest(method, path, bytes.NewReader(data))
		request.Header.Set("Content-Type", "application/json")
		if token != "" {
			request.Header.Set("Authorization", "Bearer "+token)
		}
		if cookie != nil {
			request.AddCookie(cookie)
		}
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != expected {
			t.Fatalf("%s %s: wanted %d, got %d: %s", method, path, expected, response.Code, response.Body)
		}
		if expected == 204 && response.Body.Len() != 0 {
			t.Fatal("204 has a response body")
		}
		return response
	}
	decode := func(response *httptest.ResponseRecorder) map[string]interface{} {
		t.Helper()
		var result map[string]interface{}
		if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		return result
	}
	idOf := func(response *httptest.ResponseRecorder) int {
		return int(decode(response)["data"].(map[string]interface{})["id"].(float64))
	}
	owner := tokens["owner"]
	moduleBody := map[string]interface{}{"title": "River decisions", "description": "Practice river value bets and bluff catches", "display_order": 6}
	created := call("POST", "/api/v1/modules", moduleBody, owner, nil, 201)
	moduleID := idOf(created)
	if created.Header().Get("Location") == "" {
		t.Fatal("Missing Location header")
	}
	modulePath := fmt.Sprintf("/api/v1/modules/%d", moduleID)
	call("GET", modulePath, nil, owner, nil, 200)
	call("PUT", modulePath, moduleBody, owner, nil, 200)
	quizBody := map[string]interface{}{"title": "River value quiz", "module_id": moduleID}
	quizID := idOf(call("POST", "/api/v1/quizzes", quizBody, owner, nil, 201))
	quizPath := fmt.Sprintf("/api/v1/quizzes/%d", quizID)
	call("GET", quizPath, nil, owner, nil, 200)
	call("PUT", quizPath, quizBody, owner, nil, 200)
	questionBody := map[string]interface{}{"quiz_id": quizID, "text": "How much equity does this call need?", "explanation": "Divide the call by the final pot.", "options": []map[string]interface{}{{"text": "25 percent", "is_correct": true}, {"text": "50 percent", "is_correct": false}}}
	questionID := idOf(call("POST", "/api/v1/questions", questionBody, owner, nil, 201))
	questionPath := fmt.Sprintf("/api/v1/questions/%d", questionID)
	call("GET", questionPath, nil, owner, nil, 200)
	call("PUT", questionPath, questionBody, owner, nil, 200)
	page := decode(call("GET", "/api/v1/modules?page=1&limit=2&title=Foundation", nil, owner, nil, 200))
	if page["pagination"].(map[string]interface{})["total"].(float64) != 5 || page["_links"].(map[string]interface{})["next"] == nil {
		t.Fatal("Pagination/filter/hypermedia failed")
	}
	call("GET", fmt.Sprintf("/api/v1/quizzes?module_id=%d", moduleID), nil, owner, nil, 200)
	call("GET", fmt.Sprintf("/api/v1/questions?quiz_id=%d&text=equity", quizID), nil, owner, nil, 200)
	call("GET", fmt.Sprintf("%s/quizzes", modulePath), nil, owner, nil, 200)
	call("GET", quizPath+"/questions", nil, owner, nil, 200)
	call("GET", fmt.Sprintf("%s/quizzes/%d/questions", modulePath, quizID), nil, owner, nil, 200)
	call("GET", fmt.Sprintf("/api/v1/modules/1/quizzes/%d/questions", quizID), nil, owner, nil, 404)
	call("GET", "/api/v1/overview", nil, owner, nil, 200)
	for _, path := range []string{"/api/v1/modules?page=0", "/api/v1/modules?page=99999999999999999999", "/api/v1/modules?limit=101", "/api/v1/modules/not-a-number", "/api/v1/questions?quiz_id=-1", "/api/lessons/not-a-number", "/api/scenarios/abc"} {
		call("GET", path, nil, owner, nil, 400)
	}
	call("GET", "/api/v1/modules/9999999", nil, owner, nil, 404)
	call("GET", "/api/v1/modules", nil, "", nil, 401)
	for kind, payload := range map[string]interface{}{"modules": moduleBody, "quizzes": quizBody, "questions": questionBody} {
		call("POST", "/api/v1/"+kind, payload, tokens["learner"], nil, 403)
	}
	for path, payload := range map[string]interface{}{modulePath: moduleBody, quizPath: quizBody, questionPath: questionBody} {
		call("PUT", path, payload, tokens["other"], nil, 403)
		call("DELETE", path, nil, tokens["other"], nil, 403)
	}
	call("POST", "/api/v1/quizzes", quizBody, tokens["other"], nil, 403)
	call("POST", "/api/v1/questions", questionBody, tokens["other"], nil, 403)
	for _, payload := range []map[string]interface{}{{"title": "   ", "description": "Valid long description"}, {"title": "Valid title", "description": strings.Repeat("ą", 6001)}, {"title": "Valid title", "description": "Valid long description", "display_order": -1}} {
		call("POST", "/api/v1/modules", payload, owner, nil, 400)
	}
	questionBody["options"] = []map[string]interface{}{{"text": strings.Repeat("x", 201), "is_correct": true}, {"text": "Other"}}
	call("POST", "/api/v1/questions", questionBody, owner, nil, 400)
	for _, path := range []string{"/api/health", "/api/modules", "/api/lessons/1", "/api/quizzes/1", "/api/scenarios", "/api/scenarios/1"} {
		call("GET", path, nil, owner, nil, 200)
	}
	rolePath := fmt.Sprintf("/api/users/%d/role", actors["other"].ID)
	call("PUT", rolePath, map[string]string{"role": "admin"}, tokens["learner"], nil, 403)
	call("PUT", rolePath, map[string]string{"role": "learner"}, tokens["admin"], nil, 200)
	call("PUT", rolePath, map[string]string{"role": "learner"}, tokens["admin"], nil, 200)
	call("GET", "/api/v1/modules", nil, tokens["other"], nil, 401)
	registration := map[string]string{"username": "newstudent", "email": "new@example.test", "password": "test-password-2026"}
	call("POST", "/api/register", registration, "", nil, 201)
	call("POST", "/api/register", registration, "", nil, 409)
	registration["password"] = strings.Repeat("ą", 40)
	call("POST", "/api/register", registration, "", nil, 400)
	registration["password"] = "test-password-2026"
	login := decode(call("POST", "/api/login", registration, "", nil, 200))
	access := login["token"].(string)
	response := call("POST", "/api/login", registration, "", nil, 200)
	cookie := response.Result().Cookies()[0]
	if !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode {
		t.Fatal("Missing secure refresh-cookie flags")
	}
	rotated := call("POST", "/api/refresh", nil, "", cookie, 200)
	replacement := rotated.Result().Cookies()[0]
	if replacement.Value == cookie.Value {
		t.Fatal("Refresh was not rotated")
	}
	call("POST", "/api/refresh", nil, "", cookie, 401)
	call("POST", "/api/refresh", nil, "", replacement, 401)
	call("GET", "/api/v1/modules", nil, access, nil, 401)
	response = call("POST", "/api/login", registration, "", nil, 200)
	access = decode(response)["token"].(string)
	call("POST", "/api/logout", nil, "", response.Result().Cookies()[0], 204)
	call("GET", "/api/v1/modules", nil, access, nil, 401)
	call("DELETE", questionPath, nil, owner, nil, 204)
	call("GET", questionPath, nil, owner, nil, 404)
	call("DELETE", quizPath, nil, owner, nil, 204)
	call("DELETE", modulePath, nil, owner, nil, 204)
	for _, route := range router.Routes() {
		if !covered[route.Method+" "+route.Path] {
			t.Errorf("Endpoint not exercised: %s %s", route.Method, route.Path)
		}
	}
	t.Logf("Exercised all %d registered endpoints with CRUD, scoping, ownership, validation and token lifecycle checks", len(router.Routes()))
	if os.Getenv("POKER_RUN_POSTMAN") == "1" {
		server := httptest.NewServer(router)
		defer server.Close()
		binary := "npx"
		if runtime.GOOS == "windows" {
			binary = "npx.cmd"
		}
		collection, err := filepath.Abs("../../docs/PokerLearn.postman_collection.json")
		if err != nil {
			t.Fatal(err)
		}
		command := exec.Command(binary, "--yes", "newman", "run", collection, "--bail", "--env-var", "baseUrl="+server.URL, "--env-var", "adminEmail=admin@example.test", "--env-var", "adminPassword=test-password-2026", "--reporter-cli-no-banner")
		output, err := command.CombinedOutput()
		if err != nil {
			t.Fatalf("Postman/Newman: %v\n%s", err, output)
		}
		t.Log("Postman/Newman completed every request against the isolated integration database")
	}
}
