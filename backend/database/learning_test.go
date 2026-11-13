package database

import (
	"github.com/Lihakk/poker-backend/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"os"
	"testing"
)

// Opt-in, read-only verification against an upgraded development seed database.
func TestSeedContentIntegration(t *testing.T) {
	dsn := os.Getenv("POKER_INTEGRATION_DSN")
	if dsn == "" {
		t.Skip("Set POKER_INTEGRATION_DSN to verify the development seed database")
	}
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	connection, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = connection.Close() })
	for name, model := range map[string]interface{}{"modules": &models.Module{}, "quizzes": &models.Quiz{}, "questions": &models.Question{}, "options": &models.Option{}} {
		var count int64
		if err := db.Model(model).Count(&count).Error; err != nil {
			t.Fatal(err)
		}
		if count < 5 {
			t.Errorf("%s has only %d records; at least five required", name, count)
		}
		t.Logf("%s: %d meaningful seeded records", name, count)
	}
	for text, explanation := range explanations {
		var question models.Question
		if err := db.Where("text = ?", text).First(&question).Error; err != nil {
			t.Errorf("Question %q: %v", text, err)
			continue
		}
		if question.Explanation != explanation {
			t.Errorf("Missing expected seed explanation for %q", text)
		}
	}
	checks := []struct {
		title              string
		pot, facing, raise float64
	}{
		{"Button open with suited broadways", 1.5, 1, 2.5},
		{"Top pair versus turn pressure", 72, 24, 80},
		{"River bluff candidate", 96, 0, 60},
		{"Small blind three-bet squeeze", 6.5, 2, 12},
		{"Overpair on a wet flop", 54, 0, 40},
		{"Short stack reshove", 7, 2.5, 18},
		{"Thin river value", 84, 0, 42},
		{"Ace-high bluff catcher", 58, 18, 60},
	}
	for _, check := range checks {
		var scenario models.HoldemScenario
		if err := db.Preload("Actions").Where("title = ?", check.title).First(&scenario).Error; err != nil {
			t.Errorf("Scenario %q: %v", check.title, err)
			continue
		}
		if scenario.PotSize != check.pot || scenario.FacingBet != check.facing {
			t.Errorf("Incorrect price for %q: pot=%v, call=%v", check.title, scenario.PotSize, scenario.FacingBet)
		}
		found := false
		for _, action := range scenario.Actions {
			if action.ActionType == "Raise" {
				found = true
				if action.RaiseAmount != check.raise || action.RaiseAmount > scenario.StackSize+scenario.HeroStreetBet {
					t.Errorf("Incorrect raise for %q: %v", check.title, action.RaiseAmount)
				}
			}
		}
		if !found {
			t.Errorf("No raise action for %q", check.title)
		}
	}
}
