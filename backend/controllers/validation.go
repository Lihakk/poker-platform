package controllers

import (
	"strings"
	"unicode/utf8"
)

func textWithin(value string, min, max int) bool {
	size := utf8.RuneCountInString(value)
	return size >= min && size <= max
}

func (body *moduleInput) valid() bool {
	body.Title = strings.TrimSpace(body.Title)
	body.Description = strings.TrimSpace(body.Description)
	return textWithin(body.Title, 3, 200) && textWithin(body.Description, 10, 6000) && body.DisplayOrder >= 0 && body.DisplayOrder <= 1000000
}

func (body *quizInput) valid() bool {
	body.Title = strings.TrimSpace(body.Title)
	return body.ModuleID > 0 && textWithin(body.Title, 3, 200)
}

func (body *questionInput) valid() bool {
	body.Text = strings.TrimSpace(body.Text)
	body.Explanation = strings.TrimSpace(body.Explanation)
	if body.QuizID == 0 || !textWithin(body.Text, 8, 5000) || !textWithin(body.Explanation, 0, 5000) || len(body.Options) < 2 || len(body.Options) > 8 {
		return false
	}
	seen := make(map[string]bool)
	for i := range body.Options {
		body.Options[i].Text = strings.TrimSpace(body.Options[i].Text)
		key := strings.ToLower(body.Options[i].Text)
		if !textWithin(body.Options[i].Text, 1, 200) || seen[key] {
			return false
		}
		seen[key] = true
	}
	return validOptions(body.Options)
}
