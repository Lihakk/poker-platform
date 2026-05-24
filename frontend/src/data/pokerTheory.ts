export interface TheorySection {
  title: string;
  summary: string;
  formula?: string;
  example: string;
  table: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  mistakes: string[];
}

export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  example: string;
}

export const theorySections: TheorySection[] = [
  {
    title: 'Expected Value',
    summary:
      'Expected value is the average result of a decision if the same spot happened thousands of times. A +EV play can lose this hand and still be correct.',
    formula: 'EV = chance of winning * amount won - chance of losing * amount risked',
    example:
      'If you risk 30 bb and estimate that your raise wins the 50 bb pot immediately 45% of the time, the fold-equity part alone is worth 22.5 bb before showdown equity is counted.',
    table: [
      { label: '+EV', value: 'Profitable long term', note: 'The decision makes chips over many repetitions.' },
      { label: '0 EV', value: 'Break even', note: 'Neither winning nor losing over the long run.' },
      { label: '-EV', value: 'Losing long term', note: 'Can still win one hand, but the decision is poor.' },
    ],
    mistakes: [
      'Judging EV by whether the hand won once.',
      'Ignoring fold equity when comparing bet versus check.',
      'Using raw equity without asking how much of it you can actually realize.',
    ],
  },
  {
    title: 'Pot Odds',
    summary:
      'Pot odds compare the price of calling with the final pot you can win. They tell you the minimum equity needed for a call before implied odds and future mistakes.',
    formula: 'Required equity = call amount / (pot after calling)',
    example:
      'Villain bets 25 into 75. You call 25 to win a final pot of 125, so you need 25 / 125 = 20% equity.',
    table: [
      { label: 'Half-pot bet', value: '25%', note: 'Call 50 to win final pot of 200.' },
      { label: 'Two-thirds pot', value: '29%', note: 'Call 67 to win final pot near 234.' },
      { label: 'Pot-size bet', value: '33%', note: 'Call 100 to win final pot of 300.' },
    ],
    mistakes: [
      'Dividing the call by the current pot instead of the final pot.',
      'Calling because a draw has outs without converting those outs to equity.',
      'Forgetting reverse implied odds when a made draw can still be second best.',
    ],
  },
  {
    title: 'Equity Realization',
    summary:
      'Equity is how often your hand would win by showdown. Equity realization is how much of that equity you actually capture after position, pressure, and future betting.',
    formula: 'Realized equity = raw equity * realization factor',
    example:
      'Ace-high may have 35% raw equity against a loose range, but out of position facing barrels it may realize much less because you fold before showdown.',
    table: [
      { label: 'In position', value: 'Higher realization', note: 'You can check back, value bet thinner, and control pot size.' },
      { label: 'Out of position', value: 'Lower realization', note: 'You face more pressure and reveal information first.' },
      { label: 'Nut draws', value: 'Better realization', note: 'They can continue aggressively without reverse implied odds.' },
    ],
    mistakes: [
      'Treating every 40% equity hand as an automatic call.',
      'Overvaluing dominated draws.',
      'Ignoring future streets when stacks are deep.',
    ],
  },
  {
    title: 'Fold Equity',
    summary:
      'Fold equity is the value created when your bet or raise wins immediately. It is why semi-bluffs can be profitable even when they are behind if called.',
    formula: 'Bet EV includes fold chance * current pot',
    example:
      'A flush draw with 35% equity may become a profitable raise if villain folds 40% of the time and your hand still has outs when called.',
    table: [
      { label: 'Tight opponent', value: 'More fold equity', note: 'Pressure works better if their continuing range is narrow.' },
      { label: 'Calling station', value: 'Less fold equity', note: 'Bluff less and value bet thinner.' },
      { label: 'Scary runout', value: 'More fold equity', note: 'Cards that favor your range can increase pressure.' },
    ],
    mistakes: [
      'Bluffing players who hate folding.',
      'Ignoring blockers when choosing bluffs.',
      'Using tiny sizing when your story needs pressure.',
    ],
  },
  {
    title: 'Stack-to-Pot Ratio',
    summary:
      'SPR compares remaining stack to pot size. It tells you how committed hands become and how much room remains for future street leverage.',
    formula: 'SPR = effective stack / pot',
    example:
      'With 100 bb behind and a 20 bb pot, SPR is 5. With 30 bb behind and a 30 bb pot, SPR is 1, so top pair and strong draws become much more committed.',
    table: [
      { label: 'SPR 0-2', value: 'Commitment zone', note: 'Strong pairs and draws can often play for stacks.' },
      { label: 'SPR 3-6', value: 'Pressure zone', note: 'Bet sizing can set up turn or river all-ins.' },
      { label: 'SPR 7+', value: 'Deep zone', note: 'Nut advantage, position, and implied odds matter more.' },
    ],
    mistakes: [
      'Stacking off one pair too lightly at very high SPR.',
      'Slowplaying vulnerable value hands at low SPR.',
      'Ignoring effective stack and only looking at your own stack.',
    ],
  },
  {
    title: 'Blockers',
    summary:
      'Blockers are cards in your hand that reduce the number of strong hands your opponent can have. They matter most in close river decisions.',
    formula: 'Fewer value combos = more attractive bluff or bluff catch',
    example:
      'Holding the ace of spades on a completed spade board reduces villain nut flush combinations, making a river bluff more credible.',
    table: [
      { label: 'Nut blockers', value: 'Better bluff candidates', note: 'They remove the strongest calls or raises.' },
      { label: 'Unblock folds', value: 'Better bluff candidates', note: 'You want villain to still have hands that fold.' },
      { label: 'Block bluffs', value: 'Worse bluff-catches', note: 'If you block missed draws, villain has fewer bluffs.' },
    ],
    mistakes: [
      'Bluffing only because you missed a draw.',
      'Blocking the hands you want villain to fold.',
      'Using blockers as a reason to ignore opponent tendencies.',
    ],
  },
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: 'EV',
    category: 'Math',
    definition: 'Expected value, or the average result of a decision over many repetitions.',
    example: 'A river bluff can be +EV if it works often enough relative to the amount risked.',
  },
  {
    term: 'Pot Odds',
    category: 'Math',
    definition: 'The price you are getting to call compared with the final pot.',
    example: 'Calling 20 to win 100 means you need about 20% equity.',
  },
  {
    term: 'Equity',
    category: 'Math',
    definition: 'The percentage of the pot your hand expects to win against a range at showdown.',
    example: 'A flush draw on the flop often has around 35% equity with two cards to come.',
  },
  {
    term: 'Fold Equity',
    category: 'Pressure',
    definition: 'The chance your bet or raise wins the pot immediately by making opponents fold.',
    example: 'A semi-bluff combines draw equity with fold equity.',
  },
  {
    term: 'SPR',
    category: 'Stack Depth',
    definition: 'Stack-to-pot ratio, calculated as effective stack divided by current pot.',
    example: 'At SPR 1, top pair can be much closer to a stack-off hand than at SPR 10.',
  },
  {
    term: 'Blocker',
    category: 'Ranges',
    definition: 'A card in your hand that makes it less likely an opponent has a specific strong hand.',
    example: 'The ace of a flush suit blocks the nut flush.',
  },
  {
    term: 'Range',
    category: 'Ranges',
    definition: 'The set of hands a player can reasonably have based on their actions.',
    example: 'A tight UTG open has a stronger range than a Button steal.',
  },
  {
    term: 'Implied Odds',
    category: 'Math',
    definition: 'Future money you expect to win if you improve.',
    example: 'Small pairs gain implied odds when stacks are deep and opponents overpay sets.',
  },
  {
    term: 'Reverse Implied Odds',
    category: 'Math',
    definition: 'Future money you can lose when you improve to a second-best hand.',
    example: 'A weak flush draw can lose a big pot to a higher flush.',
  },
  {
    term: 'Risk Premium',
    category: 'Tournament',
    definition: 'Extra equity needed in tournaments because losing chips can hurt more than winning chips helps.',
    example: 'Near a final table pay jump, a close chip-EV call may become a fold.',
  },
];
