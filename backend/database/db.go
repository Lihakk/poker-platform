package database

import (
	"log"

	"github.com/Lihakk/poker-backend/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

type lessonSeed struct {
	Title   string
	Content string
}

type quizSeed struct {
	Title     string
	Question  string
	Correct   string
	Distracts []string
	Questions []questionSeed
}

type questionSeed struct {
	Text      string
	Correct   string
	Distracts []string
}

type moduleSeed struct {
	Title        string
	Description  string
	DisplayOrder int
	Lessons      []lessonSeed
	Quizzes      []quizSeed
}

func Connect() {
	dsn := "poker_app:poker_app_password@tcp(127.0.0.1:3306)/poker_db?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the database!\n", err)
	}

	log.Println("Successfully connected to MariaDB.")

	DB = db
}

func SeedData() {
	seedLearningPath()
	seedScenarios()
}

func seedLearningPath() {
	modules := []moduleSeed{
		{
			Title:        "Poker 101: The Basics",
			Description:  "Learn hand rankings, table position, and disciplined preflop decisions.",
			DisplayOrder: 1,
			Lessons: []lessonSeed{
				{
					Title:   "The Importance of Position",
					Content: "Position decides how much information you have. Late position lets you widen ranges, value bet thinner, and bluff with better timing because opponents must act first.\n\nThe Button is the most valuable seat because you act last after the flop. You get to see whether opponents bet, check, or show weakness before you choose a line.\n\nOut of position, tighten your marginal calls. You will realize less equity because opponents can pressure you on later streets.",
				},
				{
					Title:   "Starting Hand Categories",
					Content: "Premium pairs and big suited broadways can build pots because they make strong top pairs, overpairs, and nut draws.\n\nSmall pairs and suited connectors prefer implied odds. They often miss, but when they connect hard they can win large pots from overpairs and top pair hands.\n\nWeak offsuit broadways are dangerous out of position. They make dominated one-pair hands and rarely have backup equity.",
				},
				{
					Title:   "Table Awareness",
					Content: "Your cards are only one input. Seat count, stack depth, opponent type, and prior action all change whether a hand is a raise, call, or fold.\n\nA hand that is a Button open can be a fold under the gun. A hand that is a call against a small bet can be a fold against a large turn barrel.\n\nBefore acting, ask four questions: what is my position, what range does villain represent, what price am I getting, and what happens on the next street?",
				},
			},
			Quizzes: []quizSeed{
				{
					Title:     "Position Basics Quiz",
					Question:  "Where should you act last in a hand of Texas Hold'em?",
					Correct:   "The Button",
					Distracts: []string{"The Big Blind", "Under the Gun", "The Small Blind"},
					Questions: []questionSeed{
						{
							Text:      "Why is acting last valuable after the flop?",
							Correct:   "You get more information before making your decision",
							Distracts: []string{"You always win ties", "Your cards become stronger", "Blinds no longer matter"},
						},
						{
							Text:      "Which seat usually has the hardest postflop realization?",
							Correct:   "Out of position in the blinds",
							Distracts: []string{"The Button", "The cutoff after everyone folds", "Any seat with suited cards"},
						},
					},
				},
				{
					Title:     "Starting Hand Quiz",
					Question:  "Which hand usually benefits most from implied odds when stacks are deep?",
					Correct:   "A small pocket pair",
					Distracts: []string{"Seven-deuce offsuit", "Ace-king suited only when short", "Any two Broadway cards out of position"},
					Questions: []questionSeed{
						{
							Text:      "Why do suited connectors improve when stacks are deep?",
							Correct:   "They can make disguised strong hands and win large future bets",
							Distracts: []string{"They always have more equity than pairs", "They cannot be dominated", "They remove all variance"},
						},
						{
							Text:      "What is the main danger of weak offsuit Broadway hands out of position?",
							Correct:   "They often make dominated one-pair hands",
							Distracts: []string{"They cannot make straights", "They always miss the flop", "They are illegal to raise"},
						},
					},
				},
			},
		},
		{
			Title:        "Pot Odds and Expected Value",
			Description:  "Turn common poker math into table decisions without slowing down the hand.",
			DisplayOrder: 2,
			Lessons: []lessonSeed{
				{
					Title:   "Pot Odds in Real Time",
					Content: "Pot odds compare the price of a call with the final pot. If a 25 bb call can win a final pot of 100 bb, you need roughly 25 percent equity before future street effects.\n\nThe common mistake is dividing by the current pot. Always divide the call amount by the pot after your call goes in.\n\nPot odds do not automatically make a call good. You also need to consider whether your outs are clean and whether future bets can force you off your equity.",
				},
				{
					Title:   "Equity Versus Realization",
					Content: "Raw equity is not always realized. In position, you often realize more equity because you can check back, control pot size, and decide after opponents act.\n\nOut of position against pressure, marginal hands under-realize. Ace-high may technically have equity, but if you fold to turn bets too often, that equity never reaches showdown.\n\nHands with nut potential realize better than dominated hands. A nut flush draw can continue aggressively; a weak flush draw can improve and still lose.",
				},
				{
					Title:   "Stack-to-Pot Ratio",
					Content: "Stack-to-pot ratio is effective stack divided by the current pot. If the pot is 25 bb and stacks are 100 bb, SPR is 4.\n\nLow SPR rewards committed value hands and strong draws. With little money behind, top pair and overpairs rise in value because fewer future decisions remain.\n\nHigh SPR rewards position, nut advantage, and hands that can keep pressure across streets. One pair becomes more fragile when stacks are deep.",
				},
			},
			Quizzes: []quizSeed{
				{
					Title:     "Pot Odds Quiz",
					Question:  "You call 20 bb to win a final pot of 100 bb. About how much equity do you need?",
					Correct:   "20 percent",
					Distracts: []string{"5 percent", "50 percent", "80 percent"},
					Questions: []questionSeed{
						{
							Text:      "Villain bets 50 into 100. What equity do you need to call before future effects?",
							Correct:   "25 percent",
							Distracts: []string{"10 percent", "33 percent", "50 percent"},
						},
						{
							Text:      "Why are pot odds only the first step?",
							Correct:   "Future bets, dirty outs, and realization can change the decision",
							Distracts: []string{"Pot odds only apply preflop", "They ignore the size of the pot", "They only work in tournaments"},
						},
					},
				},
				{
					Title:     "SPR Quiz",
					Question:  "What does a low stack-to-pot ratio usually encourage?",
					Correct:   "More committed value and draw decisions",
					Distracts: []string{"Only tiny probe bets", "Always folding one pair", "Ignoring pot odds"},
				},
				{
					Title:     "EV Quiz",
					Question:  "What does a +EV decision mean?",
					Correct:   "It makes money on average over many repetitions",
					Distracts: []string{"It always wins the current hand", "It only matters preflop", "It means you cannot lose the pot"},
					Questions: []questionSeed{
						{
							Text:      "A bluff risks 40 bb to win 60 bb. Roughly how often must it work as a pure bluff?",
							Correct:   "40 percent",
							Distracts: []string{"20 percent", "60 percent", "Always", "Never"},
						},
						{
							Text:      "Why can a losing hand still be played correctly?",
							Correct:   "Poker decisions are judged by long-term expectation, not one runout",
							Distracts: []string{"Because cards do not matter", "Because all calls are profitable", "Because losing increases EV"},
						},
					},
				},
				{
					Title:     "Equity Realization Quiz",
					Question:  "Why can a hand with enough raw equity still be a bad call?",
					Correct:   "It may not realize that equity because of position or future pressure",
					Distracts: []string{"Equity disappears after the flop", "Pot odds are never useful", "Only made hands have equity"},
				},
			},
		},
		{
			Title:        "Bluffing and Blockers",
			Description:  "Choose bluffs with removal, fold equity, board coverage, and opponent tendencies.",
			DisplayOrder: 3,
			Lessons: []lessonSeed{
				{
					Title:   "What Makes a Good Bluff",
					Content: "Good bluffs have fold equity, block villain value, unblock folds, and tell a believable story. Random missed draws are not automatically good bluffs.\n\nYour bet must target hands that can actually fold. Bluffing a calling station with no blocker and no scare card is usually just burning chips.\n\nA believable bluff fits your previous actions. If your line cannot credibly contain strong value, observant opponents will bluff-catch more often.",
				},
				{
					Title:   "Blockers and Unblockers",
					Content: "A blocker is a card in your hand that makes it less likely villain has a specific holding. The ace of a flush suit can block nut flushes.\n\nUnblockers matter too. If you do not hold the missed draws villain would fold, those folds remain available in their range.\n\nBlockers are most useful in close river spots. They should refine a decision, not replace range logic and opponent reads.",
				},
				{
					Title:   "Opponent Selection",
					Content: "Bluff tighter players more often and calling stations less often. The same hand can be a profitable bluff against one profile and a clear give-up against another.\n\nAgainst players who overfold, choose pressure lines and use sizes that make their medium-strength hands uncomfortable.\n\nAgainst players who overcall, reduce bluffs and widen thin value. If they want to call, give them a worse hand to call with.",
				},
			},
			Quizzes: []quizSeed{
				{
					Title:     "Blocker Quiz",
					Question:  "Why can holding the ace of a missed flush suit improve a river bluff?",
					Correct:   "It blocks villain's strongest flushes",
					Distracts: []string{"It guarantees you have showdown value", "It means villain cannot have a pair", "It removes all missed draws"},
					Questions: []questionSeed{
						{
							Text:      "What does it mean to unblock folds?",
							Correct:   "You do not hold the hands villain is likely to fold",
							Distracts: []string{"You force villain to fold every pair", "You remove all value hands", "You make your hand unbeatable"},
						},
						{
							Text:      "When are blockers most useful?",
							Correct:   "In close river decisions where ranges are narrow",
							Distracts: []string{"Only before cards are dealt", "Only when you have quads", "Never, blockers are random"},
						},
					},
				},
				{
					Title:     "Fold Equity Quiz",
					Question:  "When does fold equity add the most value to a semi-bluff?",
					Correct:   "When villain folds often and your hand still has outs when called",
					Distracts: []string{"When villain never folds", "When you have no equity at all", "Only when the board is paired"},
				},
			},
		},
		{
			Title:        "Tournament Pressure",
			Description:  "Practice short-stack pressure, final table incentives, antes, and risk premium decisions.",
			DisplayOrder: 4,
			Lessons: []lessonSeed{
				{
					Title:   "Short Stack Leverage",
					Content: "At 10 to 25 blinds, open sizes, reshove ranges, and fold equity matter more than deep postflop creativity.\n\nMedium pairs, suited broadways, and strong aces often prefer decisive preflop action because calling invites difficult flops and squeezes.\n\nShort stacks gain power from all-in pressure. Opponents must risk a meaningful portion of their stack to continue.",
				},
				{
					Title:   "Risk Premium",
					Content: "In tournaments, chips lost can hurt more than chips won help. Close calls become folds when pay jumps and covered stacks are involved.\n\nThis is called risk premium. You need extra equity to call all-ins because busting or losing leverage has a real tournament cost.\n\nRisk premium is highest near bubbles, final tables, and when you are covered by stacks that can eliminate you.",
				},
			},
			Quizzes: []quizSeed{
				{
					Title:     "Tournament Pressure Quiz",
					Question:  "Why can a chip-EV call become a tournament fold?",
					Correct:   "Risk premium and pay jumps make survival more valuable",
					Distracts: []string{"Pot odds stop existing", "Position no longer matters", "Only pocket aces can call"},
				},
			},
		},
		{
			Title:        "Full Hand Planning",
			Description:  "Learn how to plan a hand from preflop to river instead of making isolated street decisions.",
			DisplayOrder: 5,
			Lessons: []lessonSeed{
				{
					Title:   "Planning Before You Bet",
					Content: "Before betting, decide what you want worse hands to do, what better hands may fold, and which turn cards help your story.\n\nA flop bet without a turn plan often creates expensive guessing. Good players know whether a bet is for value, protection, denial, or bluff pressure.\n\nIf many turn cards are bad for your range, choose a size and line that avoids building a pot you cannot navigate.",
				},
				{
					Title:   "Value, Bluff, and Denial",
					Content: "A value bet wants worse hands to call. A bluff wants better hands to fold. A denial bet wants hands with equity to fold before they can realize.\n\nMany real poker bets combine these goals. For example, betting top pair on a wet board gains value from worse pairs while denying equity to straight and flush draws.\n\nWhen you cannot name the purpose of a bet, checking is often better than clicking buttons from habit.",
				},
				{
					Title:   "Showdown Planning",
					Content: "Not every hand needs to win before showdown. Some hands are good bluff-catchers because they block value and unblock bluffs.\n\nAsk what hands villain reaches the river with after each street. If missed draws are plentiful, bluff-catching improves. If their line is value-heavy, discipline matters more than curiosity.\n\nThe river is where earlier street planning becomes visible. Your line should tell a story that makes sense.",
				},
			},
			Quizzes: []quizSeed{
				{
					Title:     "Hand Planning Quiz",
					Question:  "What should you know before making a flop bet?",
					Correct:   "What the bet accomplishes and which turns you continue on",
					Distracts: []string{"Only whether you like your cards", "The exact river card", "Nothing, betting is always better"},
					Questions: []questionSeed{
						{
							Text:      "A bet that makes overcards fold before they realize equity is mostly what type of bet?",
							Correct:   "Denial",
							Distracts: []string{"Slowplay", "Chop protection only", "Mandatory bluff-catch"},
						},
						{
							Text:      "What makes a river bluff-catcher better?",
							Correct:   "It blocks value or unblocks villain's missed bluffs",
							Distracts: []string{"It has no showdown value ever", "It blocks all missed draws", "It is always bottom pair"},
						},
					},
				},
			},
		},
	}

	for _, moduleData := range modules {
		module := upsertModule(moduleData.Title, moduleData.Description, moduleData.DisplayOrder)

		for _, lessonData := range moduleData.Lessons {
			upsertLesson(module.ID, lessonData)
		}

		for _, quizData := range moduleData.Quizzes {
			upsertQuiz(module.ID, quizData)
		}
	}

	log.Println("Learning modules checked and seeded.")
}

func upsertModule(title string, description string, displayOrder int) models.Module {
	module := models.Module{}
	DB.Where("title = ?", title).FirstOrCreate(&module, models.Module{Title: title})
	DB.Model(&module).Updates(models.Module{Description: description, DisplayOrder: displayOrder})
	return module
}

func upsertLesson(moduleID uint, seed lessonSeed) {
	lesson := models.Lesson{}
	DB.Where("module_id = ? AND title = ?", moduleID, seed.Title).FirstOrCreate(&lesson, models.Lesson{
		ModuleID: moduleID,
		Title:    seed.Title,
	})
	DB.Model(&lesson).Update("content", seed.Content)
}

func upsertQuiz(moduleID uint, seed quizSeed) {
	quiz := models.Quiz{}
	DB.Where("module_id = ? AND title = ?", moduleID, seed.Title).FirstOrCreate(&quiz, models.Quiz{
		ModuleID: moduleID,
		Title:    seed.Title,
	})

	questions := seed.Questions
	if seed.Question != "" {
		questions = append([]questionSeed{{
			Text:      seed.Question,
			Correct:   seed.Correct,
			Distracts: seed.Distracts,
		}}, questions...)
	}

	for _, questionData := range questions {
		question := models.Question{}
		DB.Where("quiz_id = ? AND text = ?", quiz.ID, questionData.Text).FirstOrCreate(&question, models.Question{
			QuizID: quiz.ID,
			Text:   questionData.Text,
		})

		var optionCount int64
		DB.Model(&models.Option{}).Where("question_id = ?", question.ID).Count(&optionCount)
		if optionCount > 0 {
			continue
		}

		DB.Create(&models.Option{QuestionID: question.ID, Text: questionData.Correct, IsCorrect: true})
		for _, distract := range questionData.Distracts {
			DB.Create(&models.Option{QuestionID: question.ID, Text: distract, IsCorrect: false})
		}
	}
}

func seedScenarios() {
	module := upsertModule(
		"Scenario Lab: Applied Decisions",
		"Practice real-table spots with immediate coaching comments after every choice.",
		5,
	)

	scenarios := []models.HoldemScenario{
		{
			ModuleID:       module.ID,
			Title:          "Button open with suited broadways",
			HeroPosition:   "BTN",
			HoleCards:      "QsJs",
			BoardCards:     "",
			PotSize:        15,
			StackSize:      100,
			Street:         "Preflop",
			Difficulty:     "Beginner",
			VillainProfile: "Overfolding blinds",
			Focus:          "Preflop ranges",
			NarrativeSetup: "Action folds to you on the Button in a 6-max cash game. The blinds are regulars who fold too much to steals.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "Too tight. QJs plays well in position and benefits from fold equity against blinds who overfold."},
				{ActionType: "Call", IsOptimal: false, CoachComment: "Calling is not available when action folds to you preflop. You should enter with a raise or fold."},
				{ActionType: "Raise", RaiseAmount: 25, IsOptimal: true, CoachComment: "Good. A 2.2x to 2.5x open pressures the blinds while risking little and keeps weaker hands in."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "Top pair versus turn pressure",
			HeroPosition:   "CO",
			HoleCards:      "AhQd",
			BoardCards:     "Qc7s2h9h",
			PotSize:        72,
			StackSize:      118,
			Street:         "Turn",
			Difficulty:     "Intermediate",
			VillainProfile: "Aggressive regular",
			Focus:          "Pot control",
			NarrativeSetup: "You raised cutoff, the Big Blind called, and you c-bet the flop. On the turn, the Big Blind check-raises your second barrel.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "Folding top pair top kicker is often too cautious here, especially when draws like hearts and T8 picked up equity."},
				{ActionType: "Call", IsOptimal: true, CoachComment: "Good. Calling keeps bluffs and worse value hands in while controlling the pot with a strong but non-nut hand."},
				{ActionType: "Raise", RaiseAmount: 160, IsOptimal: false, CoachComment: "Reraising isolates you against sets, two pair, and strong combo draws. Your hand has enough showdown value to call."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "River bluff candidate",
			HeroPosition:   "BB",
			HoleCards:      "As5s",
			BoardCards:     "Kh9s4s2c8d",
			PotSize:        96,
			StackSize:      140,
			Street:         "River",
			Difficulty:     "Advanced",
			VillainProfile: "Tight caller",
			Focus:          "River bluffing",
			NarrativeSetup: "You defended the Big Blind, check-called flop with the nut flush draw, and both players checked turn. The river bricks and villain checks back to you.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "There is no bet facing you on the river. Folding gives up a chance to win when ace-high is rarely good."},
				{ActionType: "Call", IsOptimal: false, CoachComment: "Checking can be acceptable against calling stations, but this missed draw blocks strong ace-high floats and can pressure weak pairs."},
				{ActionType: "Raise", RaiseAmount: 72, IsOptimal: true, CoachComment: "Good bluff. You block nut flushes and can represent king-x or delayed value after the turn checked through."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "Small blind three-bet squeeze",
			HeroPosition:   "SB",
			HoleCards:      "AcKd",
			BoardCards:     "",
			PotSize:        9,
			StackSize:      96,
			Street:         "Preflop",
			Difficulty:     "Intermediate",
			VillainProfile: "Loose opener",
			Focus:          "Three-betting",
			NarrativeSetup: "The cutoff opens, Button calls, and you are in the Small Blind with ace-king offsuit. Big Blind is tight and unlikely to cold-call.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "Much too tight. AKo is far ahead of the opener and caller ranges."},
				{ActionType: "Call", IsOptimal: false, CoachComment: "Calling creates a multiway pot out of position. You lose fold equity and let the Big Blind realize cheaply."},
				{ActionType: "Raise", RaiseAmount: 42, IsOptimal: true, CoachComment: "Good squeeze. Your blockers reduce premium holdings and the dead money rewards aggression."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "Overpair on a wet flop",
			HeroPosition:   "UTG",
			HoleCards:      "AsAd",
			BoardCards:     "JsTs8d",
			PotSize:        54,
			StackSize:      122,
			Street:         "Flop",
			Difficulty:     "Advanced",
			VillainProfile: "Combo-draw heavy",
			Focus:          "Protection value",
			NarrativeSetup: "You opened UTG, the Button called, and the flop is highly connected with two spades. Button has many pair-plus-draw hands.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "Never fold here without extreme action. You have an overpair plus the ace of spades blocker."},
				{ActionType: "Call", IsOptimal: false, CoachComment: "Checking can induce, but passive calling lets too many draws realize equity."},
				{ActionType: "Raise", RaiseAmount: 42, IsOptimal: true, CoachComment: "Betting large charges draws and denies equity while your hand remains strong against pair-plus-draw holdings."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "Short stack reshove",
			HeroPosition:   "CO",
			HoleCards:      "7h7d",
			BoardCards:     "",
			PotSize:        7,
			StackSize:      18,
			Street:         "Preflop",
			Difficulty:     "Intermediate",
			VillainProfile: "Late opener",
			Focus:          "Tournament pressure",
			NarrativeSetup: "A loose hijack opens in a tournament with antes. You cover only 18 big blinds and the blinds are capable of squeezing.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "Too cautious. Pocket sevens perform well as a reshove against a loose late opener."},
				{ActionType: "Call", IsOptimal: false, CoachComment: "Flatting invites squeezes and difficult flops with a shallow stack."},
				{ActionType: "Raise", RaiseAmount: 180, IsOptimal: true, CoachComment: "Good jam. You maximize fold equity and avoid guessing postflop with a medium pair."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "Thin river value",
			HeroPosition:   "BTN",
			HoleCards:      "KcQh",
			BoardCards:     "Qs9d4c2s6h",
			PotSize:        84,
			StackSize:      130,
			Street:         "River",
			Difficulty:     "Advanced",
			VillainProfile: "Sticky bluff-catcher",
			Focus:          "Thin value",
			NarrativeSetup: "You bet flop, checked turn, and villain checks river after calling from the Big Blind. They dislike folding second pair and weak queens.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "There is no bet facing you. Checking is possible, but folding is not a legal river action here."},
				{ActionType: "Call", IsOptimal: false, CoachComment: "Checking back wins often, but misses value from worse queens and stubborn nines."},
				{ActionType: "Raise", RaiseAmount: 48, IsOptimal: true, CoachComment: "Good thin value. Small sizing targets bluff-catchers without overexposing against check-raises."},
			},
		},
		{
			ModuleID:       module.ID,
			Title:          "Ace-high bluff catcher",
			HeroPosition:   "BB",
			HoleCards:      "AhJh",
			BoardCards:     "Kd7c3s3h2d",
			PotSize:        58,
			StackSize:      88,
			Street:         "River",
			Difficulty:     "Beginner",
			VillainProfile: "Missed c-bettor",
			Focus:          "Bluff catching",
			NarrativeSetup: "The Button c-bet flop, checked turn, and bets small on a blank river. Many missed broadway floats arrive here.",
			Actions: []models.ScenarioAction{
				{ActionType: "Fold", IsOptimal: false, CoachComment: "Folding is safe but too tight against this sizing and line. Ace-high blocks some value and beats missed broadways."},
				{ActionType: "Call", IsOptimal: true, CoachComment: "Good bluff catch. The small bet and checked turn keep enough missed hands in villain's range."},
				{ActionType: "Raise", RaiseAmount: 115, IsOptimal: false, CoachComment: "Turning ace-high into a bluff is unnecessary. You already beat a meaningful portion of villain's bluffs."},
			},
		},
	}

	for _, scenarioData := range scenarios {
		upsertScenario(scenarioData)
	}

	log.Println("Scenario lab checked and seeded.")
}

func upsertScenario(seed models.HoldemScenario) {
	scenario := models.HoldemScenario{}
	DB.Where("title = ?", seed.Title).FirstOrCreate(&scenario, models.HoldemScenario{
		ModuleID: seed.ModuleID,
		Title:    seed.Title,
	})

	DB.Model(&scenario).Updates(models.HoldemScenario{
		ModuleID:       seed.ModuleID,
		HeroPosition:   seed.HeroPosition,
		HoleCards:      seed.HoleCards,
		BoardCards:     seed.BoardCards,
		PotSize:        seed.PotSize,
		StackSize:      seed.StackSize,
		Street:         seed.Street,
		Difficulty:     seed.Difficulty,
		VillainProfile: seed.VillainProfile,
		Focus:          seed.Focus,
		NarrativeSetup: seed.NarrativeSetup,
	})

	var actionCount int64
	DB.Model(&models.ScenarioAction{}).Where("scenario_id = ?", scenario.ID).Count(&actionCount)
	if actionCount > 0 {
		return
	}

	for _, action := range seed.Actions {
		action.ScenarioID = scenario.ID
		DB.Create(&action)
	}
}
