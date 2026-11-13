package database

import (
	"github.com/Lihakk/poker-backend/models"
	"gorm.io/gorm"
)

var explanations = map[string]string{
	"Where should you act last in a hand of Texas Hold'em?":                                  "The button acts last after the flop, so it sees the other players' decisions before choosing a line. Preflop action order differs, especially heads-up.",
	"Why is acting last valuable after the flop?":                                            "Acting last reveals bets and checks before you commit chips. This supports better value bets, bluff choices and pot control; it does not change your cards.",
	"Which seat usually has the hardest postflop realization?":                               "The blinds commonly act before the preflop aggressor. Marginal hands may face later pressure and fail to reach showdown, so their raw equity can under-realize.",
	"Which hand usually benefits most from implied odds when stacks are deep?":               "Small pairs often miss the flop, but can make disguised sets. Deep effective stacks can provide future winnings when an opponent pays; a set is not guaranteed and a cheap call alone does not establish profitability.",
	"Why do suited connectors improve when stacks are deep?":                                 "They can make straights, flushes and strong draws that win later bets. That upside depends on effective stacks, position and opponent tendencies; it does not remove variance.",
	"What is the main danger of weak offsuit Broadway hands out of position?":                "A weak kicker can make a second-best top pair against stronger broadways. Without position or suited backup equity, these hands can win small pots and lose larger ones.",
	"You call 20 bb to win a final pot of 100 bb. About how much equity do you need?":        "Required equity is call cost divided by final pot: 20 / 100 = 20%. The final pot must include your call. This is a showdown threshold before rake and later action.",
	"Villain bets 50 into 100. What equity do you need to call before future effects?":       "The opponent's bet makes the current pot 150 bb. Your 50 bb call makes the final pot 200 bb. Required equity is 50 / 200 = 25%.",
	"Why are pot odds only the first step?":                                                  "Direct odds price the immediate call. Dirty outs, later wagers, reverse implied odds and folding before showdown can prevent you from realizing the equity you counted.",
	"What does a low stack-to-pot ratio usually encourage?":                                  "A small remaining stack relative to the pot leaves fewer betting decisions and often makes strong pairs or draws more committed. It is still necessary to evaluate the opponent's range and price.",
	"What does a +EV decision mean?":                                                         "Expected value is a probability-weighted average of net outcomes. A positive average can include many losing individual hands; one runout cannot prove a strategy good or bad.",
	"A bluff risks 40 bb to win 60 bb. Roughly how often must it work as a pure bluff?":      "Break-even folds are risk / (risk + reward): 40 / (40 + 60) = 40%. This assumes no showdown equity when called and no later betting.",
	"Why can a losing hand still be played correctly?":                                       "The right decision is based on information and probabilities available at the time. Variance can produce a losing outcome even when the modeled long-run expectation is positive.",
	"Why can a hand with enough raw equity still be a bad call?":                             "Raw equity assumes reaching showdown. Position, future pressure and dominated improvements can prevent the hand from capturing its raw share of the pot.",
	"Why can holding the ace of a completed flush suit improve a river bluff?":               "When three cards of a suit are on the board, holding that suit's ace removes opponent nut-flush combinations. It can reduce strong calls, but does not guarantee folds. A missed flush suit does not block a made flush.",
	"What does it mean to unblock folds?":                                                    "You leave combinations the opponent would fold in their possible range. Holding those same cards would remove some of the folds your bluff needs.",
	"When are blockers most useful?":                                                         "Removal can meaningfully shift the ratio of value, bluffs and folds in narrow river ranges. It refines a close decision; it does not replace range analysis.",
	"When does fold equity add the most value to a semi-bluff?":                              "A semi-bluff has two winning paths: opponents fold immediately, or you improve and win when called. Both paths must be weighted against the wager and the actual calling range.",
	"Why can a chip-EV call become a tournament fold?":                                       "Tournament payouts make chip value non-linear. Losing a covered stack near a payout jump can reduce expected prize equity even when the call gains chips on average. Exact ICM needs all stacks and payouts.",
	"What should you know before making a flop bet?":                                         "Identify whether the bet earns value, bluffs better hands or denies equity, then decide which turn cards and opponent responses change your continuation plan.",
	"A bet that makes overcards fold before they realize equity is mostly what type of bet?": "Equity denial prevents a currently worse hand from seeing later cards that could improve it. Such a bet may also earn value, but forcing those overcards out is the denial component.",
	"What makes a river bluff-catcher better?":                                               "An attractive catcher blocks value while leaving likely bluffs available. Compare the estimated bluff fraction with the pot-odds threshold instead of judging only your hand's absolute rank.",
}

// Only recognized legacy seed records and missing explanations are updated.
func UpgradeLearningContent() error {
	return DB.Transaction(func(tx *gorm.DB) error {
		old := "Why can holding the ace of a missed flush suit improve a river bluff?"
		corrected := "Why can holding the ace of a completed flush suit improve a river bluff?"
		if err := tx.Model(&models.Question{}).Where("text = ? AND (explanation IS NULL OR explanation = '')", old).Update("text", corrected).Error; err != nil {
			return err
		}
		for text, explanation := range explanations {
			if err := tx.Model(&models.Question{}).Where("text = ? AND (explanation IS NULL OR explanation = '')", text).Update("explanation", explanation).Error; err != nil {
				return err
			}
		}
		fixes := []struct {
			title                                   string
			oldRaise, raise, pot, facing, committed float64
			position, narrative, coach              string
		}{
			{"Button open with suited broadways", 25, 2.5, 1.5, 1, 0, "BTN", "Action folds to you on the Button. Blinds are 0.5 / 1 bb and the current pot is 1.5 bb. These blinds tend to overfold to opens.", "A 2.5 bb open pressures the blinds while retaining positional playability. Limping is legal but gives up immediate pressure; the exploit depends on the overfolding read."},
			{"Top pair versus turn pressure", 160, 80, 72, 24, 0, "CO", "You raised cutoff and the Big Blind called your flop continuation bet. On the turn they lead 24 bb. The current pot, including this bet, is 72 bb.", "A raise builds a large pot with a non-nut pair. Calling needs 25% equity and keeps bluffs available under the aggressive-opponent read; strong value-heavy ranges can change that answer."},
			{"River bluff candidate", 72, 60, 96, 0, 0, "BTN", "You opened the Button and the Big Blind called. You bet the flop with a flush draw, checked back turn, and the Big Blind checks the river. No bet faces you.", "This is a possible bluff against a player who overfolds weak pairs. The missed spades do not block made flushes on this board, and holding them can remove missed-draw folds. The opponent read matters more than a blanket blocker claim."},
			{"Small blind three-bet squeeze", 42, 12, 6.5, 2, .5, "SB", "Cutoff opens to 2.5 bb, Button calls, and you posted 0.5 bb in the Small Blind. The Big Blind posted 1 bb. Current pot 6.5 bb; calling costs 2 bb.", "A squeeze to 12 bb contests the dead money and avoids a passive multiway pot out of position. Your additional investment is 11.5 bb; calls and later ranges still matter."},
			{"Overpair on a wet flop", 42, 40, 54, 0, 0, "UTG", "You opened UTG, the Button called and both players reach this connected flop. You act first with no bet facing you. The pot is 54 bb.", "A 40 bb value/protection bet charges worse pairs and draws. Check is also a legal strategic option; an overpair is not invulnerable on a connected board."},
			{"Short stack reshove", 180, 18, 7, 2.5, 0, "CO", "A loose Hijack opens to 2.5 bb in an ante tournament. The current pot is 7 bb and you have 18 bb remaining. No chips are yet committed by you this street.", "An 18 bb reshove creates fold equity and avoids awkward shallow-stack calls. Its chip EV depends on the opener and calling ranges; this example does not calculate ICM."},
			{"Thin river value", 48, 42, 84, 0, 0, "BTN", "You bet flop, checked back turn, and the Big Blind checks the river. The current pot is 84 bb. The opponent often pays with weak queens and nines.", "A half-pot value bet targets worse queens and stubborn nines. If those hands stop calling, checking back gains appeal. Plan a response to a check-raise."},
			{"Ace-high bluff catcher", 115, 60, 58, 18, 0, "BB", "Button bet flop, checked back turn and bets 18 bb on this river. The current pot including their wager is 58 bb. Your read is that missed broadways bluff this size frequently.", "Raising a hand that already beats many bluffs often folds out those bluffs while getting called by better. Calling needs 18 / 76 = 23.7% equity; verify the bluff frequency rather than assuming it."},
		}
		for _, fix := range fixes {
			var scenario models.HoldemScenario
			err := tx.Where("title = ?", fix.title).First(&scenario).Error
			if err == gorm.ErrRecordNotFound {
				continue
			}
			if err != nil {
				return err
			}
			var action models.ScenarioAction
			err = tx.Where("scenario_id = ? AND action_type = 'Raise' AND raise_amount = ?", scenario.ID, fix.oldRaise).First(&action).Error
			if err == gorm.ErrRecordNotFound {
				continue
			}
			if err != nil {
				return err
			}
			if err := tx.Model(&scenario).Updates(map[string]interface{}{"pot_size": fix.pot, "facing_bet": fix.facing, "hero_street_bet": fix.committed, "hero_position": fix.position, "narrative_setup": fix.narrative}).Error; err != nil {
				return err
			}
			if err := tx.Model(&action).Updates(map[string]interface{}{"raise_amount": fix.raise, "coach_comment": fix.coach}).Error; err != nil {
				return err
			}
			if fix.title == "Button open with suited broadways" {
				if err := tx.Model(&models.ScenarioAction{}).Where("scenario_id = ? AND action_type = 'Call'", scenario.ID).Update("coach_comment", "Limping is legal when action folds to you. Here an open raise is the reference answer because of position and the overfolding read.").Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
