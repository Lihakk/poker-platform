package main

import (
	"encoding/json"
	"github.com/Lihakk/poker-backend/controllers"
	"github.com/gin-gonic/gin"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/goccy/go-yaml"
)

func TestOpenAPIDocument(t *testing.T) {
	content, err := os.ReadFile("../docs/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	var document struct {
		OpenAPI string                 `yaml:"openapi"`
		Paths   map[string]interface{} `yaml:"paths"`
	}
	if err := yaml.Unmarshal(content, &document); err != nil {
		t.Fatal(err)
	}
	if document.OpenAPI != "3.0.3" || len(document.Paths) < 15 {
		t.Fatalf("unexpected OpenAPI document: version %q, %d paths", document.OpenAPI, len(document.Paths))
	}
}

func TestOpenAPICoversProductionRoutes(t *testing.T) {
	content, err := os.ReadFile("../docs/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	var document struct {
		Paths map[string]map[string]interface{} `yaml:"paths"`
	}
	if err := yaml.Unmarshal(content, &document); err != nil {
		t.Fatal(err)
	}
	normalize := func(path string) string { return regexp.MustCompile(`\{[^}]+\}|:[^/]+`).ReplaceAllString(path, "{}") }
	documented := map[string]bool{}
	for path, methods := range document.Paths {
		for method := range methods {
			documented[strings.ToUpper(method)+" "+normalize(path)] = true
		}
	}
	gin.SetMode(gin.TestMode)
	router := gin.New()
	controllers.RegisterRoutes(router)
	for _, route := range router.Routes() {
		if !documented[route.Method+" "+normalize(route.Path)] {
			t.Errorf("Undocumented endpoint: %s %s", route.Method, route.Path)
		}
	}
}

func TestPostmanCollectionIncludesOwnershipChecks(t *testing.T) {
	content, err := os.ReadFile("../docs/PokerLearn.postman_collection.json")
	if err != nil {
		t.Fatal(err)
	}
	var collection struct {
		Item []struct {
			Item []struct {
				Name  string        `json:"name"`
				Event []interface{} `json:"event"`
			} `json:"item"`
		} `json:"item"`
	}
	if err := json.Unmarshal(content, &collection); err != nil {
		t.Fatal(err)
	}
	count, ownership := 0, 0
	for _, folder := range collection.Item {
		for _, item := range folder.Item {
			count++
			if len(item.Event) == 0 {
				t.Errorf("Missing assertions: %s", item.Name)
			}
			if strings.Contains(item.Name, "Other editor cannot") {
				ownership++
			}
		}
	}
	if count < 50 || ownership < 6 {
		t.Fatalf("Incomplete collection: %d requests, %d ownership checks", count, ownership)
	}
}

func TestComposeDocument(t *testing.T) {
	content, err := os.ReadFile("../compose.yaml")
	if err != nil {
		t.Fatal(err)
	}
	var document struct {
		Services map[string]interface{} `yaml:"services"`
	}
	if err := yaml.Unmarshal(content, &document); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"db", "api", "web"} {
		if _, ok := document.Services[name]; !ok {
			t.Fatalf("missing compose service %q", name)
		}
	}
}
