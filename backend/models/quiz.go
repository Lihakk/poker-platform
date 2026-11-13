package models

type Quiz struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	ModuleID  uint       `gorm:"not null" json:"module_id"`
	Title     string     `gorm:"not null" json:"title"`
	Questions []Question `json:"questions"`
}

type Question struct {
	ID          uint     `gorm:"primaryKey" json:"id"`
	QuizID      uint     `gorm:"not null" json:"quiz_id"`
	Text        string   `gorm:"type:text;not null" json:"text"`
	Explanation string   `gorm:"type:text" json:"explanation"`
	Options     []Option `json:"options"`
}

type Option struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	QuestionID uint   `gorm:"not null" json:"question_id"`
	Text       string `gorm:"not null" json:"text"`
	IsCorrect  bool   `gorm:"default:false" json:"is_correct"`
}
