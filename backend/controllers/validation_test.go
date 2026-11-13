package controllers

import (
	"strings"
	"testing"
)

func TestContentValidation(t *testing.T) {
	for _, body := range []moduleInput{
		{Title: "   ", Description: "A useful description"},
		{Title: "Valid title", Description: strings.Repeat("x", 6001)},
		{Title: "Valid title", Description: "A useful description", DisplayOrder: -1},
		{Title: strings.Repeat("ą", 201), Description: "A useful description"},
	} {
		if body.valid() {
			t.Errorf("Accepted invalid module: %.40q", body.Title)
		}
	}
	body := moduleInput{Title: "  Banko šansai  ", Description: "  Kaip apskaičiuoti banko šansus.  "}
	if !body.valid() || body.Title != "Banko šansai" {
		t.Fatal("Unicode normalization failed")
	}
	for _, title := range []string{"  ", strings.Repeat("a", 201)} {
		quiz := quizInput{ModuleID: 1, Title: title}
		if quiz.valid() {
			t.Fatal("Accepted invalid quiz")
		}
	}
	question := questionInput{QuizID: 1, Text: "What is the correct price?", Options: []optionInput{{Text: "25 percent", IsCorrect: true}, {Text: " 25 PERCENT "}}}
	if question.valid() {
		t.Fatal("Accepted duplicate answers")
	}
	question.Options[1].Text = strings.Repeat("x", 201)
	if question.valid() {
		t.Fatal("Accepted oversized answer")
	}
	question.Options[1].Text = "50 percent"
	if !question.valid() {
		t.Fatal("Rejected valid question")
	}
}
