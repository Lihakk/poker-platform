package models

type Module struct {
	ID           uint             `gorm:"primaryKey" json:"id"`
	Title        string           `gorm:"not null" json:"title"`
	Description  string           `gorm:"type:text" json:"description"`
	DisplayOrder int              `gorm:"default:0" json:"display_order"`
	Lessons      []Lesson         `json:"lessons"`
	Quizzes      []Quiz           `json:"quizzes"`
	Scenarios    []HoldemScenario `json:"scenarios"`
}

type Lesson struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	ModuleID uint   `gorm:"not null" json:"module_id"`
	Title    string `gorm:"not null" json:"title"`
	Content  string `gorm:"type:text" json:"content"`
}
