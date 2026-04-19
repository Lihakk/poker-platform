package models

type HoldemScenario struct {
	ID             uint   `gorm:"primaryKey"`
	ModuleID       uint   `gorm:"not null"`
	Title          string `gorm:"not null"`
	HeroPosition   string `gorm:"size:5;not null"` // e.g., "UTG", "BTN"
	HoleCards      string `gorm:"size:4;not null"` // e.g., "AhKd"
	BoardCards     string `gorm:"size:10"`         // e.g., "2s7c9h" (Can be empty for pre-flop)
	PotSize        int    `gorm:"not null"`
	StackSize      int    `gorm:"not null"`
	NarrativeSetup string `gorm:"type:text"`

	// Link to the possible choices the user can make
	Actions []ScenarioAction `gorm:"foreignKey:ScenarioID"`
}

type ScenarioAction struct {
	ID           uint   `gorm:"primaryKey"`
	ScenarioID   uint   `gorm:"not null"`
	ActionType   string `gorm:"size:10;not null"` // "Fold", "Call", "Raise"
	RaiseAmount  int    // Can be 0 if the action is Fold or Call
	IsOptimal    bool   `gorm:"default:false"`
	CoachComment string `gorm:"type:text"` // The feedback shown after clicking
}
