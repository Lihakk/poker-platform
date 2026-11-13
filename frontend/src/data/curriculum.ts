export interface StudyQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  concept: string;
}
export interface StudyTopic {
  slug: string;
  title: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  minutes: number;
  description: string;
  takeaway: string;
  sections: { title: string; paragraphs: string[] }[];
  example: { title: string; hand?: string; board?: string; steps: string[] };
  traps: string[];
  questions: StudyQuestion[];
  practice: string;
}
const question = (
  id: string,
  concept: string,
  text: string,
  options: string[],
  correct: number,
  explanation: string,
): StudyQuestion => ({ id, concept, text, options, correct, explanation });

export const curriculum: StudyTopic[] = [
  {
    slug: "hand-rankings",
    title: "Read the best five cards",
    level: "Foundation",
    minutes: 6,
    description: "Hand rankings, kickers, board-only hands and split pots.",
    takeaway:
      "In Hold’em, any five of your seven cards make the hand. You can use zero, one or two hole cards.",
    sections: [
      {
        title: "The ranking ladder",
        paragraphs: [
          "From strongest to weakest: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card. A royal flush is the ace-high straight flush, not an extra category.",
          "Compare the category first. When categories match, compare the important ranks: a full house compares the three-of-a-kind rank before the pair. Flushes compare their five ranks from highest downward.",
        ],
      },
      {
        title: "Kickers and ties",
        paragraphs: [
          "A kicker is a card used to break a tie after the main made hand. With one pair, up to three kickers matter. With two pair, exactly one kicker matters.",
          "Suits do not break ties in Hold’em. If both players have the same best five ranks, they split the eligible pot even when their unused hole cards differ.",
        ],
      },
      {
        title: "The board can play",
        paragraphs: [
          "If the board itself is the best five-card hand for both players, neither player owns it. An ace in your hand does not beat a shared straight unless it actually improves the five-card straight.",
          "An ace can be high in TJQKA or low in A2345. It cannot wrap around to make QKA23.",
        ],
      },
    ],
    example: {
      title: "An ace that changes nothing",
      hand: "AsQd",
      board: "9hTcJsQhKd",
      steps: [
        "The board makes a king-high straight.",
        "Your ace combines with T-J-Q-K to make an ace-high straight.",
        "You beat an opponent holding two low cards; a second ace would tie you. Always assemble the actual five cards.",
      ],
    },
    traps: [
      "Comparing unused kickers.",
      "Giving one suit priority over another.",
      "Calling three pairs a stronger category than two pair.",
    ],
    questions: [
      question(
        "rank-1",
        "Hand rankings",
        "The board is As Ks Qs Js Ts. You hold 2c 2d. What is your hand?",
        [
          "One pair",
          "Royal flush, shared by every remaining player",
          "High card",
        ],
        1,
        "The five board cards form an ace-high straight flush. No hole card can improve it, so all remaining players tie.",
      ),
      question(
        "rank-2",
        "Hand rankings",
        "Which full house wins: 888AA or KKK22?",
        ["888AA because of aces", "KKK22", "They tie"],
        1,
        "The three-of-a-kind rank is compared first. Three kings beat three eights; the pair rank only matters if the trips rank ties.",
      ),
      question(
        "rank-3",
        "Hand rankings",
        "Which is a legal straight?",
        ["Q K A 2 3", "A 2 3 4 5", "2 4 6 8 T"],
        1,
        "An ace can be low in the wheel A2345, or high in TJQKA. It cannot sit in the middle of a wrapping straight.",
      ),
    ],
    practice: "/game-simulator",
  },
  {
    slug: "position",
    title: "Position and preflop discipline",
    level: "Foundation",
    minutes: 7,
    description:
      "Acting order, wider late-position ranges and effective stacks.",
    takeaway:
      "Position changes the value of information, not the physical strength of your cards.",
    sections: [
      {
        title: "Who acts first?",
        paragraphs: [
          "Before the flop, action starts left of the big blind. After the flop it starts left of the button among players still in the hand. The button usually acts last postflop.",
          "Heads-up is special: the button posts the small blind and acts first preflop, but acts last after the flop. The big blind still has an option to raise after everyone merely calls.",
        ],
      },
      {
        title: "Opening versus calling",
        paragraphs: [
          "Opening a pot can win the blinds immediately. Calling an open cannot. Your opening range and calling range should therefore be different even from the same seat.",
          "Earlier positions have more players behind them who can wake up with strong hands. Later positions can open more widely, but stack depth, rake and opponent behavior still matter. A chart is a baseline for a specific setup, not a universal answer.",
        ],
      },
      {
        title: "Effective stack",
        paragraphs: [
          "Heads-up, the effective stack is the smaller stack. You cannot win more from an opponent than that opponent can put into the pot.",
          "In a multiway pot, each pair of players may have a different effective stack. Short all-ins create a main pot and deeper players can build separate side pots.",
        ],
      },
    ],
    example: {
      title: "Same cards, different seats",
      hand: "Ks9s",
      steps: [
        "At a full table from early position, several players can have stronger kings and aces behind you.",
        "On the button after everyone folds, only the blinds remain and you retain postflop position.",
        "The hand’s cards did not improve. Fold equity and information did.",
      ],
    },
    traps: [
      "Using a button chart under the gun.",
      "Treating a call as equivalent to an open.",
      "Sizing a bet against a 20 bb player as if they had 200 bb.",
    ],
    questions: [
      question(
        "pos-1",
        "Position",
        "Heads-up, who acts first before the flop?",
        ["Button / small blind", "Big blind", "The player with fewer chips"],
        0,
        "The heads-up button posts the small blind and acts first preflop. Postflop the big blind acts first.",
      ),
      question(
        "pos-2",
        "Position",
        "You have 180 bb and one opponent has 45 bb. What is the effective stack?",
        ["225 bb", "180 bb", "45 bb"],
        2,
        "Only 45 bb from each player can be contested. An unmatched extra wager by the deeper player is returned.",
      ),
      question(
        "pos-3",
        "Position",
        "Why can the button open more hands after folds?",
        [
          "Its cards have more showdown equity",
          "Fewer players remain and it has postflop position",
          "It must pay the big blind",
        ],
        1,
        "The button has fewer opponents to get through and will act last postflop. Position is a strategic advantage, not a change in card probabilities.",
      ),
    ],
    practice: "/game-simulator",
  },
  {
    slug: "pot-odds",
    title: "Pot odds without double counting",
    level: "Foundation",
    minutes: 8,
    description:
      "The correct denominator, common bet sizes and break-even calls.",
    takeaway: "Required equity = your call / the final pot after your call.",
    sections: [
      {
        title: "Define the pot first",
        paragraphs: [
          "In this app, “current pot” includes the opponent’s latest bet, but excludes your pending call. That convention makes the formula C / (P + C), with P the current pot and C your call.",
          "If someone instead quotes the pot before the opponent bets, add the opponent’s bet and your call to that starting pot. Mixing the two conventions is the most common double-counting error.",
        ],
      },
      {
        title: "Memorize the landmarks",
        paragraphs: [
          "A half-pot bet into an unopened pot needs 25% equity to call. A pot-size bet needs 33.3%. A two-times-pot bet needs 40%. Larger bets offer a worse price.",
          "These are break-even showdown thresholds before rake and future action. On the river you see no more cards; on earlier streets you may still have to pay to reach showdown.",
        ],
      },
      {
        title: "Price is not permission",
        paragraphs: [
          "Compare the price to equity against a range, not against the one hand you hope your opponent has.",
          "A draw can have sufficient two-card equity yet fail to realize it when another bet comes on the turn. Start with the immediate price, then account for future decisions.",
        ],
      },
    ],
    example: {
      title: "A 25 bb river decision",
      steps: [
        "The pot was 50 bb. Your opponent bets 25 bb, so the current pot is 75 bb.",
        "You call 25 bb. The final pot is 100 bb.",
        "Required equity = 25 / 100 = 25%. At 30% equity, call EV = 0.30 × 100 − 25 = +5 bb.",
      ],
    },
    traps: [
      "Dividing the call by the pot before calling.",
      "Adding the opponent bet twice.",
      "Using two-card draw odds when only one card is guaranteed.",
    ],
    questions: [
      question(
        "odds-1",
        "Pot odds",
        "Current pot including the opponent bet is 90 bb. You must call 30 bb. Required equity?",
        ["25%", "33.3%", "50%"],
        0,
        "The final pot is 90 + 30 = 120 bb. Your price is 30 / 120 = 25%.",
      ),
      question(
        "odds-2",
        "Pot odds",
        "A player bets 100 into a 100 bb pot. What equity breaks even on a call?",
        ["25%", "33.3%", "50%"],
        1,
        "After the opponent bets, there are 200 bb in the middle. Your 100 bb call creates a final pot of 300 bb: 100 / 300 = 33.3%.",
      ),
      question(
        "odds-3",
        "Pot odds",
        "A river call costs 20 bb. The final pot would be 100 bb. Your equity is 15%. What is call EV?",
        ["+15 bb", "−5 bb", "0 bb"],
        1,
        "EV is equity × final pot minus cost: 0.15 × 100 − 20 = −5 bb. Folding has incremental EV zero.",
      ),
    ],
    practice: "/poker-math",
  },
  {
    slug: "expected-value",
    title: "Expected value and good decisions",
    level: "Foundation",
    minutes: 8,
    description:
      "Net outcomes, sunk costs and results versus decision quality.",
    takeaway:
      "EV is a weighted average of future net outcomes. Chips already committed are sunk costs.",
    sections: [
      {
        title: "From outcomes to an average",
        paragraphs: [
          "Multiply each possible net outcome by its probability, then add them. The word net matters: losing your call is a negative outcome and winning returns your own call along with the pot.",
          "For a heads-up showdown call, the compact formula is equity × final pot − call cost. Equity includes your share of tied outcomes, so the formula also handles splits.",
        ],
      },
      {
        title: "Use the same starting point",
        paragraphs: [
          "Evaluate fold, call and raise from the current decision. Folding has zero additional chip EV; it does not magically recover chips you put in earlier.",
          "Compare all actions with a consistent pot definition. A line that wins a large gross pot can still be worse after subtracting its larger investment.",
        ],
      },
      {
        title: "A model is not a guarantee",
        paragraphs: [
          "Estimated EV depends on the range, fold rate, future action and rake assumptions. Small EV differences can be less meaningful than the uncertainty in those inputs.",
          "This trainer samples showdowns. It does not solve an equilibrium strategy tree. A recommendation is an opportunity to inspect the assumptions, not proof that an action is optimal in every real game.",
        ],
      },
    ],
    example: {
      title: "A winning decision that often loses",
      steps: [
        "A river call costs 30 bb and would create a final pot of 150 bb.",
        "At 25% equity, EV = 0.25 × 150 − 30 = +7.5 bb.",
        "You still lose most individual showdowns. Across the modeled repetitions, the weighted average is positive.",
      ],
    },
    traps: [
      "Subtracting the call twice.",
      "Calling because you already invested chips.",
      "Judging a decision only by its last runout.",
    ],
    questions: [
      question(
        "ev-1",
        "Expected value",
        "A call costs 10 bb and the final pot is 50 bb. At 30% equity, EV is:",
        ["+5 bb", "+15 bb", "−7 bb"],
        0,
        "0.30 × 50 − 10 = +5 bb. The 15 bb expected gross return includes your own wager; subtract the full 10 bb investment once.",
      ),
      question(
        "ev-2",
        "Expected value",
        "You already put 40 bb into the pot. What is the incremental EV of folding now?",
        ["−40 bb", "0 bb", "+40 bb"],
        1,
        "From the current decision, folding adds no more loss or gain. Earlier investment is a sunk cost, although it remains part of the total hand result.",
      ),
      question(
        "ev-3",
        "Expected value",
        "A +EV call loses at showdown. What follows?",
        [
          "The model must be wrong",
          "A positive average can still include losses",
          "The next call is guaranteed to win",
        ],
        1,
        "EV describes a probability-weighted average, not a guaranteed outcome. One result cannot establish whether the range estimate was correct.",
      ),
    ],
    practice: "/poker-math",
  },
  {
    slug: "outs-equity",
    title: "Outs, draws and equity",
    level: "Intermediate",
    minutes: 9,
    description:
      "Clean outs, exact draw probabilities and the rule of two and four.",
    takeaway:
      "An out improves your hand. A clean out improves it enough to win.",
    sections: [
      {
        title: "Count cards, not wishful outcomes",
        paragraphs: [
          "A four-card flush draw generally has nine unseen cards of its suit. An open-ended straight draw generally has eight completing cards. A gutshot generally has four.",
          "Do not add overlapping outs twice: a card that makes both a straight and a flush is still one card. Some apparent outs can give an opponent a stronger hand or pair a dangerous board.",
        ],
      },
      {
        title: "One card versus two",
        paragraphs: [
          "On the flop with two hole cards and three board cards known, 47 cards are unseen. With nine clean outs, hitting on the next card is 9 / 47 ≈ 19.1%.",
          "If both remaining cards will be seen without paying again, the chance of hitting by the river is 1 − (38 / 47) × (37 / 46) ≈ 35.0%. From the turn, nine outs give 9 / 46 ≈ 19.6%.",
        ],
      },
      {
        title: "Probability versus equity",
        paragraphs: [
          "The rule of two and four approximates hit probability: about 2% per out for one card and 4% per out for two cards. It is a shortcut and becomes less accurate with many outs.",
          "Hit probability is not always equity. You may already be ahead, tie, improve and still lose, or hit an out only to face a redraw. Equity needs the complete opponent range and runout model.",
        ],
      },
    ],
    example: {
      title: "Nut flush draw on the flop",
      hand: "AsQs",
      board: "7s2sKd",
      steps: [
        "Four spades are visible. Nine spades remain unseen.",
        "Next-card flush probability is about 19%; seeing both cards gives about 35%.",
        "Your ace and queen can also pair, but whether those are winning outs depends on the opponent’s range.",
      ],
    },
    traps: [
      "Counting the same card twice.",
      "Calling with two-card odds when a turn bet can force a fold.",
      "Assuming every improvement is a winner.",
    ],
    questions: [
      question(
        "outs-1",
        "Draws and equity",
        "A normal four-card flush draw has how many unseen cards of its suit?",
        ["4", "9", "13"],
        1,
        "There are 13 cards in each suit. Four are visible between your hand and the board, leaving nine unseen spades, hearts, diamonds or clubs.",
      ),
      question(
        "outs-2",
        "Draws and equity",
        "With nine clean outs on the turn, approximate chance of hitting on the river?",
        ["19.6%", "36%", "50%"],
        0,
        "Six cards are known, leaving 46 unseen. Nine winners out of 46 give 19.6% for the one remaining card.",
      ),
      question(
        "outs-3",
        "Draws and equity",
        "A card completes both your straight and flush. Count it:",
        ["Twice", "Once", "Only if it is an ace"],
        1,
        "Outs count distinct physical cards. A card that helps in two ways remains one possible next card.",
      ),
    ],
    practice: "/poker-math",
  },
  {
    slug: "ranges-combos",
    title: "Ranges and combinations",
    level: "Intermediate",
    minutes: 10,
    description: "169 hand classes, 1,326 combinations and card removal.",
    takeaway:
      "A range is a weighted set of hands, refined by each action and known card.",
    sections: [
      {
        title: "Classes are not equally common",
        paragraphs: [
          "A pocket pair has six suit combinations. A suited non-pair has four. An offsuit non-pair has twelve. The 169 starting-hand classes expand to 1,326 actual two-card combinations.",
          "A range with equal numbers of suited and offsuit classes does not contain equal numbers of actual hands. Combo counts are the right starting point for comparing value and bluffs.",
        ],
      },
      {
        title: "Remove impossible hands",
        paragraphs: [
          "Holding one ace reduces AA from six combinations to three. Holding two aces leaves only one AA combination for someone else, before accounting for the board.",
          "A visible card removes every opponent combination that contains it. The trainer enforces this card removal before sampling ranges and drawing remaining board cards.",
        ],
      },
      {
        title: "Actions update weights",
        paragraphs: [
          "An early-position open suggests a different starting range from a button open. A raise, a call, and a check affect which parts of that range remain plausible.",
          "Do not force every action into a single exact hand. Keep value, draws and possible bluffs in view, then revise their relative frequency as new actions appear.",
        ],
      },
    ],
    example: {
      title: "An ace blocker in numbers",
      hand: "AsJd",
      steps: [
        "Without any known aces, AA has C(4,2) = 6 combinations.",
        "Your ace leaves three aces: C(3,2) = 3 combinations.",
        "AK also shrinks from 16 to 12 combinations, before other known cards. Removing value can change close decisions, but does not create fold equity by itself.",
      ],
    },
    traps: [
      "Equating one hand class with one combination.",
      "Leaving blocked cards in an opponent’s range.",
      "Assuming a big bet always means one exact hand.",
    ],
    questions: [
      question(
        "range-1",
        "Ranges",
        "How many combinations does an unblocked pocket pair have?",
        ["4", "6", "12"],
        1,
        "Choose two suits from the four cards of the same rank: C(4,2) = 6.",
      ),
      question(
        "range-2",
        "Ranges",
        "You hold As. Before seeing a board, how many AA combinations can an opponent have?",
        ["6", "4", "3"],
        2,
        "Three aces remain unseen. Choosing two from three produces three pairs.",
      ),
      question(
        "range-3",
        "Ranges",
        "Which non-pair class has more combinations?",
        ["AK suited: 4", "AK offsuit: 12", "They are equal"],
        1,
        "There are 16 total AK combinations, of which four have matching suits. The remaining twelve are offsuit.",
      ),
    ],
    practice: "/ai-games",
  },
  {
    slug: "bet-sizing",
    title: "Bet sizing and fold equity",
    level: "Intermediate",
    minutes: 9,
    description: "Value, bluffs, denial and break-even fold frequencies.",
    takeaway:
      "Name what you want a bet to accomplish before choosing its size.",
    sections: [
      {
        title: "Three purposes",
        paragraphs: [
          "Value bets want worse hands to call. Bluffs want better hands to fold. Equity denial makes hands with meaningful future equity give up. A single bet can combine purposes.",
          "A bigger bet changes both the price and the range that continues. It does not necessarily improve EV: worse hands may fold and the remaining calls become stronger.",
        ],
      },
      {
        title: "The pure-bluff threshold",
        paragraphs: [
          "With no showdown equity, bet EV is F × P − (1 − F) × B. P is the current pot, B your bet, and F the probability everyone folds.",
          "Break-even folds are B / (P + B). Betting half pot needs more than 33.3% folds; betting full pot needs more than 50%. Multiway, all relevant opponents must fold for the immediate bluff to win.",
        ],
      },
      {
        title: "Minimum defence is a model",
        paragraphs: [
          "In a simple river model where a bluff has zero equity when called, the theoretical minimum defence frequency is P / (P + B). It is the complement of the bluffer’s break-even fold rate.",
          "That benchmark is not an instruction to call every population bet at that frequency. If an opponent underbluffs, folding more can be the right exploit. Earlier-street equity and multiple players complicate the model.",
        ],
      },
    ],
    example: {
      title: "Risk 50 to win 100",
      steps: [
        "Your pure bluff bets 50 bb into a 100 bb pot.",
        "Break-even fold frequency = 50 / 150 = 33.3%.",
        "At 40% folds, EV = 0.40 × 100 − 0.60 × 50 = +10 bb. At 25% folds it becomes −12.5 bb.",
      ],
    },
    traps: [
      "Bluffing because a draw missed.",
      "Assuming an overbet always makes more money.",
      "Confusing bluff fold thresholds with call pot odds.",
    ],
    questions: [
      question(
        "bet-1",
        "Bet sizing",
        "A pure bluff bets 100 into 100. Break-even folds?",
        ["33.3%", "50%", "66.7%"],
        1,
        "You risk 100 to win 100. The fold rate must be 100 / (100 + 100) = 50% to break even.",
      ),
      question(
        "bet-2",
        "Bet sizing",
        "What does a value bet primarily want?",
        [
          "Better hands to fold",
          "Worse hands to call",
          "Every opponent to fold",
        ],
        1,
        "Value comes from being called by worse hands. If a larger size removes almost all worse calls, it can damage the value bet.",
      ),
      question(
        "bet-3",
        "Bet sizing",
        "A larger bluff size:",
        [
          "Always has more EV",
          "Needs more folds to break even",
          "Makes your equity exactly 50%",
        ],
        1,
        "As B increases, B / (P + B) increases. A bigger risk needs a higher fold frequency to offset it.",
      ),
    ],
    practice: "/poker-math",
  },
  {
    slug: "implied-odds",
    title: "Implied odds and realization",
    level: "Intermediate",
    minutes: 9,
    description: "Future winnings, dominated draws and the price of position.",
    takeaway:
      "Future winnings are an estimate. Count them only when the opponent can and will pay.",
    sections: [
      {
        title: "Beyond the immediate pot",
        paragraphs: [
          "Implied odds add future money you expect to win after improving. They matter most when direct odds are insufficient but strong hidden hands can win additional chips.",
          "A short effective stack limits this upside. A draw that becomes obvious may get fewer calls than one whose improvement is disguised.",
        ],
      },
      {
        title: "Reverse implied odds",
        paragraphs: [
          "Improving can still create a second-best hand. Weak flush draws, dominated aces and low straights can win small pots and lose large ones.",
          "Those future losses are reverse implied odds. They are a reason to be careful with a superficially cheap call, especially deep and out of position.",
        ],
      },
      {
        title: "Realizing your share",
        paragraphs: [
          "Raw equity assumes reaching showdown. Equity realization describes how much of that share your strategy captures while betting, folding and playing later streets.",
          "Position lets you check back, see an opponent’s action and choose when to build a pot. Draws with nut potential also withstand pressure better than dominated one-pair hands. No fixed realization multiplier fits every situation.",
        ],
      },
    ],
    example: {
      title: "How much extra money is needed?",
      steps: [
        "Current pot is 80 bb, your call is 20 bb, and clean one-card hit probability is 15%.",
        "In a simplified hit-or-fold model, EV = 0.15 × (100 + X) − 20.",
        "Break even needs X = 20 / 0.15 − 100 ≈ 33.3 bb of additional net opponent chips on winning outcomes. This assumes every hit wins and misses cost nothing later.",
      ],
    },
    traps: [
      "Counting the entire opponent stack as guaranteed winnings.",
      "Ignoring second-best improved hands.",
      "Applying implied odds to a river call with no later betting.",
    ],
    questions: [
      question(
        "implied-1",
        "Implied odds",
        "Implied odds are most limited when:",
        [
          "Effective stacks are short",
          "Stacks are deep",
          "Your draw is well disguised",
        ],
        0,
        "An opponent with few remaining chips cannot pay much more even if you hit. Short effective stacks cap future winnings.",
      ),
      question(
        "implied-2",
        "Implied odds",
        "A weak flush draw makes a flush and loses to a higher flush. This illustrates:",
        ["Fold equity", "Reverse implied odds", "A guaranteed split"],
        1,
        "The hand improved but remained second best, potentially losing additional chips. That is reverse implied odds.",
      ),
      question(
        "implied-3",
        "Implied odds",
        "Why does position help realize equity?",
        [
          "It changes the deck",
          "It allows better information and pot control",
          "It guarantees showdown",
        ],
        1,
        "Acting after the opponent gives you information and the option to check back. It improves strategic control without changing card probabilities.",
      ),
    ],
    practice: "/situations",
  },
  {
    slug: "spr-planning",
    title: "SPR and a plan for later streets",
    level: "Intermediate",
    minutes: 8,
    description: "Commitment, geometric sizing and changing board textures.",
    takeaway:
      "A flop bet is the first part of a hand plan, not a standalone answer.",
    sections: [
      {
        title: "Stack-to-pot ratio",
        paragraphs: [
          "SPR is the effective remaining stack divided by the pot. A 100 bb stack with a 25 bb pot has SPR 4.",
          "Low SPR leaves less room for later decisions. Strong one-pair hands can become easier to commit; deep high-SPR pots reward nut potential. Neither rule makes top pair an automatic stack-off.",
        ],
      },
      {
        title: "Plan useful and awkward cards",
        paragraphs: [
          "Before betting, identify which turn cards improve your range, complete opponent draws, or make your value hand too thin.",
          "Choose whether you will bet again, check for pot control, or give up against pressure. A larger flop pot reduces future SPR and affects the cost of each later decision.",
        ],
      },
      {
        title: "Geometric sizing",
        paragraphs: [
          "In a simplified heads-up pot with one caller each street, betting the same fraction g for n streets grows the pot by (1 + 2g)^n.",
          "If the starting pot is P and effective stack S will all go in by the final street, g = ((1 + 2S/P)^(1/n) − 1) / 2. This is a sizing framework under specific assumptions, not a mandate to put every hand all-in.",
        ],
      },
    ],
    example: {
      title: "Two streets to put in 90 bb",
      steps: [
        "The pot is 30 bb, the effective stack is 90 bb, and two betting streets remain.",
        "g = (√(1 + 180/30) − 1) / 2 ≈ 0.823.",
        "Bet about 24.7 bb now. After a call the pot is about 79.4 bb and the remaining 65.3 bb is again about 82.3% pot.",
      ],
    },
    traps: [
      "Using your own stack when the opponent is shorter.",
      "Treating low SPR as permission to ignore a strong range.",
      "Betting flop without deciding which turns matter.",
    ],
    questions: [
      question(
        "spr-1",
        "Hand planning",
        "Effective stack 80 bb, pot 20 bb. SPR?",
        ["0.25", "4", "100"],
        1,
        "SPR = effective remaining stack / pot = 80 / 20 = 4.",
      ),
      question(
        "spr-2",
        "Hand planning",
        "After betting and receiving a call, SPR usually:",
        ["Decreases", "Always doubles", "Stays unchanged"],
        0,
        "Your remaining stack is smaller while the pot is larger. Both changes reduce stack-to-pot ratio.",
      ),
      question(
        "spr-3",
        "Hand planning",
        "Before a flop bet, which question is useful?",
        [
          "Which turn cards change my plan?",
          "Will I win this exact runout?",
          "Can I recover sunk costs?",
        ],
        0,
        "Planning the next street makes bet sizing and continuing decisions coherent. You cannot know the runout and earlier investment is sunk.",
      ),
    ],
    practice: "/game-simulator",
  },
  {
    slug: "river-blockers",
    title: "River bluff-catching and blockers",
    level: "Advanced",
    minutes: 10,
    description: "Value-to-bluff ratios, removal and plausible missed draws.",
    takeaway:
      "A bluff-catcher earns its equity from opponent bluffs, not from beating value hands.",
    sections: [
      {
        title: "Count plausible bluffs",
        paragraphs: [
          "A pure bluff-catcher loses to the value range and wins against the bluff range. In that simplified model, equity equals the fraction of bluffs among bets.",
          "For a pot-size river bet, a call needs one-third equity. If the betting range contains 12 value combinations and 6 bluffs with equal weight, the bluff share is 6 / 18 = one-third.",
        ],
      },
      {
        title: "Block value, unblock bluffs",
        paragraphs: [
          "A useful blocker reduces combinations of the opponent’s strong value. An unblocked missed draw leaves a plausible bluff in their range.",
          "A missed flush card can be good or bad: it might block strong flush value on one board but remove the opponent’s most natural bluffs on another. Reconstruct the actual line instead of applying a suit rule blindly.",
        ],
      },
      {
        title: "Exploit the betting population",
        paragraphs: [
          "A theoretically balanced ratio is a benchmark. If the opponent reaches the river with too few bluffs, a bluff-catcher can be a fold even with an attractive blocker.",
          "Track actions and revealed hands carefully, including sample size. One aggressive hand does not establish that an opponent always bluffs.",
        ],
      },
    ],
    example: {
      title: "The price of removing a bluff",
      hand: "AhJd",
      board: "Kc7h3h2s9c",
      steps: [
        "The heart draw missed. Some missed hearts could now bluff.",
        "Holding Ah removes some of those missed-draw combinations.",
        "Your ace-high can beat bluffs, but removing bluffs may make a call worse. A blocker is meaningful only relative to value and bluff combos.",
      ],
    },
    traps: [
      "Calling because your hand looks strong in isolation.",
      "Blocking the bluffs you need the opponent to have.",
      "Assuming a balanced bluff frequency without evidence.",
    ],
    questions: [
      question(
        "river-1",
        "River decisions",
        "A range has 12 value combos and 4 bluffs. A pure bluff-catcher’s equity is:",
        ["25%", "33.3%", "75%"],
        0,
        "The catcher beats 4 of the 16 equally weighted bets: 4 / 16 = 25%.",
      ),
      question(
        "river-2",
        "River decisions",
        "Which blocker is generally attractive for a bluff-catcher?",
        [
          "One removing value while leaving bluffs",
          "One removing all missed draws",
          "Any ace, regardless of board",
        ],
        0,
        "Removing value increases the relative bluff fraction; leaving natural bluffs in the range preserves hands you beat.",
      ),
      question(
        "river-3",
        "River decisions",
        "You need 33.3% equity but estimate a bluff share of 20%. A pure bluff-catcher should:",
        [
          "Call because pot odds are good",
          "Fold under these assumptions",
          "Raise any size",
        ],
        1,
        "Its 20% equity is below the 33.3% break-even threshold. A profitable call needs more bluffs or a different hand that also beats some value.",
      ),
    ],
    practice: "/ai-games",
  },
  {
    slug: "tournament-pressure",
    title: "Tournament risk and ICM",
    level: "Advanced",
    minutes: 9,
    description:
      "Chip EV, payout equity and the limits of simple all-in advice.",
    takeaway:
      "Tournament chips and prize money are not linearly interchangeable.",
    sections: [
      {
        title: "Why cash-game logic changes",
        paragraphs: [
          "In a cash-game chip model, each chip has the same unit value. In a tournament, payout steps and elimination risk change what chips are worth in expected prize money.",
          "The independent chip model (ICM) estimates finishing probabilities from stack shares and converts them into payout equity. It deliberately ignores differences in skill, position and future blind pressure.",
        ],
      },
      {
        title: "Risk premium",
        paragraphs: [
          "A call can gain chips on average while reducing expected payout. A covered player near a payout jump may need additional equity beyond the chip-EV break-even price.",
          "That extra equity requirement is risk premium. Its size depends on all remaining stacks and the payout structure; a generic “bubble pressure” percentage cannot calculate it accurately.",
        ],
      },
      {
        title: "Use the trainer honestly",
        paragraphs: [
          "The simulator uses chips and fixed blinds, not a payout-based tournament model. Short-stack sessions practice legal all-in decisions and effective stacks.",
          "Do not read its chip-EV estimate as exact ICM advice. To evaluate a tournament all-in, supply the complete stack distribution, payouts, and calling ranges to a dedicated model.",
        ],
      },
    ],
    example: {
      title: "Same call, different incentives",
      steps: [
        "Consider a short stack about to be eliminated elsewhere and a large payout jump approaching.",
        "A medium stack calling the chip leader risks elimination before that short stack.",
        "The price in chips is unchanged, but the payout consequences can justify a tighter call. Exact equity requires the actual stacks and payouts.",
      ],
    },
    traps: [
      "Using chip EV as exact prize-money EV.",
      "Treating a tournament label as an ICM calculation.",
      "Ignoring players outside the current hand.",
    ],
    questions: [
      question(
        "icm-1",
        "Tournament risk",
        "What does ICM primarily convert?",
        [
          "Stack shares and payouts into estimated prize equity",
          "Suits into hand strength",
          "Rake into blinds",
        ],
        0,
        "ICM uses tournament stacks and the payout schedule to estimate expected prize-money equity under its assumptions.",
      ),
      question(
        "icm-2",
        "Tournament risk",
        "A chip-EV profitable call can be a payout-EV losing call:",
        [
          "Never",
          "Sometimes near payout pressure",
          "Only before the tournament begins",
        ],
        1,
        "Elimination and payout jumps make chips non-linear in prize value. Taking variance can cost payout equity even when it gains chips.",
      ),
      question(
        "icm-3",
        "Tournament risk",
        "Which input is needed for a real ICM calculation?",
        [
          "Only your hole cards",
          "All remaining stacks and payouts",
          "Only the current pot",
        ],
        1,
        "Tournament payout equity depends on every remaining stack and the payout schedule, not just the players contesting this pot.",
      ),
    ],
    practice: "/custom-games",
  },
  {
    slug: "variance-review",
    title: "Variance and productive hand review",
    level: "Foundation",
    minutes: 7,
    description:
      "Sample size, estimation error and a repeatable review process.",
    takeaway: "Separate a bad outcome, a poor decision and a wrong assumption.",
    sections: [
      {
        title: "A short sample is noisy",
        paragraphs: [
          "A strong hand can lose several times in a row. Independent trials do not remember past results; a losing streak does not make the next win “due”.",
          "The trainer shows Monte Carlo sampling uncertainty. More samples narrow that uncertainty, but they do not fix a badly chosen opponent range. Model uncertainty and sampling error are different.",
        ],
      },
      {
        title: "Review the decision point",
        paragraphs: [
          "Record the cards known at the time, pot, effective stacks, actions and opponent reads. Then compare legal alternative lines using the same assumptions.",
          "Do not allow revealed hole cards to rewrite what you reasonably knew before acting. Use showdown information to update future reads, not to pretend the earlier decision was certain.",
        ],
      },
      {
        title: "Build a feedback loop",
        paragraphs: [
          "Tag one recurring leak: poor pot accounting, thin bluff-catches, excessive out-of-position calls, or unclear bet purpose. Study that concept, practice a few related spots, and review again.",
          "Saved hands and notes are stored per account on this browser. They are study records, not a verified record of real-money results. The app uses practice chips only.",
        ],
      },
    ],
    example: {
      title: "A useful review note",
      steps: [
        "“Turn call: current pot 75, price 25, effective stack 60.”",
        "“Assumed opponent value plus draws; needed 25% equity. Which draws actually continue?”",
        "“Next practice: compare this hand against a tight range and remove dirty outs.”",
      ],
    },
    traps: [
      "Believing a win is due after losses.",
      "Confusing sampling accuracy with range accuracy.",
      "Reviewing only the biggest lost pots.",
    ],
    questions: [
      question(
        "var-1",
        "Hand review",
        "More Monte Carlo trials primarily reduce:",
        [
          "Sampling error",
          "All opponent-range uncertainty",
          "The number of legal raises",
        ],
        0,
        "More trials better estimate the outcomes of the chosen range model. They do not establish whether the range itself is correct.",
      ),
      question(
        "var-2",
        "Hand review",
        "An independent hand follows five losses. The next hand is:",
        [
          "Guaranteed to win",
          "Still governed by its own probabilities",
          "More likely to win because it is due",
        ],
        1,
        "Independent outcomes have no memory. A streak does not alter the next deal’s probabilities.",
      ),
      question(
        "var-3",
        "Hand review",
        "A useful hand review starts with:",
        [
          "The final winner only",
          "Information available at the decision",
          "The worst possible opponent hand",
        ],
        1,
        "Review cards, pot, stacks, action and reads known at the time. Avoid hindsight based on cards that were revealed later.",
      ),
    ],
    practice: "/game-simulator",
  },
];

export const studySources = [
  {
    title: "PokerStars Learn · Pot odds",
    url: "https://www.pokerstars.uk/poker/learn/lesson/pot-odds/",
  },
  {
    title: "PokerStars Learn · Outs",
    url: "https://www.pokerstars.uk/poker/learn/lesson/calculating-outs/",
  },
  {
    title: "PokerStars · Nuts and blockers",
    url: "https://www.pokerstars.com/poker/games/rules/hand-rankings/the-nuts-and-blockers/",
  },
  {
    title: "Berkeley Poker · Preflop lecture",
    url: "https://poker.studentorg.berkeley.edu/public/lecture_slides/Lecture3_F25_Stat198.pdf",
  },
];
