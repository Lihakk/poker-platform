package models

type HoldemScenario struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	ModuleID       uint   `gorm:"not null" json:"module_id"`
	Title          string `gorm:"not null" json:"title"`
	HeroPosition   string `gorm:"size:5;not null" json:"hero_position"` // e.g., "UTG", "BTN"
	HoleCards      string `gorm:"size:4;not null" json:"hole_cards"`    // e.g., "AhKd"
	BoardCards     string `gorm:"size:10" json:"board_cards"`           // e.g., "2s7c9h" (Can be empty for pre-flop)
	PotSize        int    `gorm:"not null" json:"pot_size"`
	StackSize      int    `gorm:"not null" json:"stack_size"`
	Street         string `gorm:"size:12" json:"street"`
	Difficulty     string `gorm:"size:16" json:"difficulty"`
	VillainProfile string `gorm:"size:40" json:"villain_profile"`
	Focus          string `gorm:"size:40" json:"focus"`
	NarrativeSetup string `gorm:"type:text" json:"narrative_setup"`

	// Link to the possible choices the user can make
	Actions []ScenarioAction `gorm:"foreignKey:ScenarioID" json:"actions"`
}

type ScenarioAction struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	ScenarioID   uint   `gorm:"not null" json:"scenario_id"`
	ActionType   string `gorm:"size:10;not null" json:"action_type"` // "Fold", "Call", "Raise"
	RaiseAmount  int    `json:"raise_amount"`                        // Can be 0 if the action is Fold or Call
	IsOptimal    bool   `gorm:"default:false" json:"is_optimal"`
	CoachComment string `gorm:"type:text" json:"coach_comment"` // The feedback shown after clicking
}
