export type PlayerAction = 'Fold' | 'Call' | 'Raise';

export interface AdvisorInput {
  holeCards: string;
  boardCards?: string;
  potSize: number;
  stackSize: number;
  position?: string;
  facingBet?: number;
  opponentStyle?: string;
  focus?: string;
  difficulty?: string;
  seats?: number;
  format?: string;
  anteLevel?: string;
  tablePressure?: string;
}

export interface AdvisorResult {
  recommendation: PlayerAction;
  equity: number;
  potOdds: number;
  spr: number;
  foldEquity: number;
  callEv: number;
  raiseEv: number;
  confidence: number;
  handClass: string;
  texture: string;
  reasoning: string;
  drills: string[];
}

interface Card {
  rank: string;
  suit: string;
  value: number;
}

const rankValues: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const formatEv = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)} bb`;

export const parseCards = (cards: string): Card[] => {
  const matches = cards.match(/.{1,2}/g) ?? [];

  return matches
    .map((card) => {
      const rank = card[0]?.toUpperCase();
      const suit = card[1]?.toLowerCase();
      if (!rank || !suit || !rankValues[rank]) return null;
      return { rank, suit, value: rankValues[rank] };
    })
    .filter((card): card is Card => card !== null);
};

const countBy = <T,>(items: T[], getKey: (item: T) => string) =>
  items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

const estimatePreflopEquity = (holeCards: Card[], position?: string, seats = 6) => {
  if (holeCards.length < 2) return 0.35;

  const [first, second] = holeCards;
  const high = Math.max(first.value, second.value);
  const low = Math.min(first.value, second.value);
  const gap = Math.max(high - low - 1, 0);
  const pairBonus = first.value === second.value ? 0.22 + high / 80 : 0;
  const suitedBonus = first.suit === second.suit ? 0.04 : 0;
  const connectedBonus = gap === 0 ? 0.04 : gap === 1 ? 0.025 : gap === 2 ? 0.01 : -0.015;
  const highCardScore = (high + low) / 90;
  const positionBonus = ['BTN', 'CO', 'SB'].includes(position ?? '') ? 0.04 : position === 'UTG' ? -0.04 : 0;
  const tablePenalty = seats >= 8 ? -0.03 : seats <= 2 ? 0.05 : 0;

  return clamp(0.22 + highCardScore + pairBonus + suitedBonus + connectedBonus + positionBonus + tablePenalty, 0.18, 0.86);
};

const hasStraightDraw = (cards: Card[]) => {
  const uniqueValues = Array.from(new Set(cards.flatMap((card) => (card.value === 14 ? [14, 1] : [card.value])))).sort((a, b) => a - b);

  for (let start = 1; start <= 10; start += 1) {
    const window = [start, start + 1, start + 2, start + 3, start + 4];
    const hits = window.filter((value) => uniqueValues.includes(value)).length;
    if (hits >= 4) return true;
  }

  return false;
};

const estimatePostflop = (holeCards: Card[], boardCards: Card[]) => {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = countBy(allCards, (card) => card.rank);
  const suitCounts = countBy(allCards, (card) => card.suit);
  const boardHigh = Math.max(...boardCards.map((card) => card.value), 0);
  const heroRanks = new Set(holeCards.map((card) => card.rank));
  const pairedRanks = Object.entries(rankCounts).filter(([, count]) => count >= 2);
  const heroPairs = pairedRanks.filter(([rank]) => heroRanks.has(rank));
  const trips = Object.values(rankCounts).some((count) => count >= 3);
  const twoPair = pairedRanks.length >= 2;
  const overpair = holeCards[0]?.value === holeCards[1]?.value && holeCards[0].value > boardHigh;
  const topPair = heroPairs.some(([rank]) => rankValues[rank] === boardHigh);
  const flushDraw = Object.values(suitCounts).some((count) => count === 4);
  const madeFlush = Object.values(suitCounts).some((count) => count >= 5);
  const straightDraw = hasStraightDraw(allCards);

  let equity = 0.28;
  let handClass = 'high card or weak pair';

  if (madeFlush) {
    equity = 0.78;
    handClass = 'made flush';
  } else if (trips) {
    equity = 0.72;
    handClass = 'trips or better';
  } else if (twoPair) {
    equity = 0.65;
    handClass = 'two pair';
  } else if (overpair) {
    equity = 0.62;
    handClass = 'overpair';
  } else if (topPair) {
    equity = 0.57;
    handClass = 'top pair';
  } else if (heroPairs.length > 0) {
    equity = 0.45;
    handClass = 'pair';
  }

  if (flushDraw) equity += 0.08;
  if (straightDraw) equity += 0.06;
  if (boardCards.length === 5 && heroPairs.length === 0 && !madeFlush && !straightDraw) equity -= 0.1;

  const textureParts = [
    flushDraw || madeFlush ? 'suited pressure' : 'rainbow or low flush pressure',
    straightDraw ? 'connected' : 'disconnected',
    boardCards.length >= 4 ? 'later street' : 'early street',
  ];

  return {
    equity: clamp(equity, 0.08, 0.92),
    handClass,
    texture: textureParts.join(', '),
  };
};

const estimateFoldEquity = (input: AdvisorInput, spr: number, equity: number) => {
  const style = input.opponentStyle?.toLowerCase() ?? '';
  const focus = input.focus?.toLowerCase() ?? '';
  const pressure = input.tablePressure?.toLowerCase() ?? '';
  const difficulty = input.difficulty?.toLowerCase() ?? '';
  const positionBonus = ['BTN', 'CO'].includes(input.position ?? '') ? 0.08 : input.position === 'BB' ? -0.03 : 0;
  const styleAdjustment = style.includes('tight') ? 0.14 : style.includes('loose') ? -0.1 : style.includes('aggressive') ? -0.03 : 0.02;
  const focusAdjustment = focus.includes('river') ? 0.05 : focus.includes('preflop') ? 0.03 : 0;
  const pressureAdjustment = pressure.includes('bubble') || pressure.includes('final') ? 0.06 : pressure.includes('deep') ? -0.02 : 0;
  const difficultyAdjustment = difficulty.includes('advanced') ? -0.02 : difficulty.includes('beginner') ? 0.03 : 0;
  const sprAdjustment = spr > 6 ? 0.04 : spr < 2 ? -0.05 : 0;
  const equityAdjustment = equity < 0.32 ? 0.04 : equity > 0.58 ? -0.03 : 0;

  return clamp(0.34 + positionBonus + styleAdjustment + focusAdjustment + pressureAdjustment + difficultyAdjustment + sprAdjustment + equityAdjustment, 0.12, 0.72);
};

const generateDrills = (input: AdvisorInput, result: Pick<AdvisorResult, 'recommendation' | 'spr' | 'equity' | 'foldEquity'>) => {
  const drills = [
    `Replay this setup at ${Math.max(10, Math.round(input.stackSize * 0.75))} bb and ${Math.round(input.stackSize * 1.25)} bb stacks.`,
    `Compare ${result.recommendation} against the next-best line using pot odds before checking the answer.`,
  ];

  if (result.spr < 3) drills.push('Add a shove-or-fold version because the stack-to-pot ratio is compressed.');
  if ((input.focus ?? '').toLowerCase().includes('river')) drills.push('Run the same river with one blocker changed and watch how bluff quality moves.');
  if ((input.tablePressure ?? '').toLowerCase().includes('bubble')) drills.push('Repeat the hand with one shorter stack behind to test risk-premium discipline.');
  if (result.equity < 0.35 && result.foldEquity > 0.45) drills.push('Tag this as a fold-equity hand, not a showdown-value hand.');

  return drills;
};

export const estimateRecommendation = (input: AdvisorInput): AdvisorResult => {
  const holeCards = parseCards(input.holeCards);
  const boardCards = parseCards(input.boardCards ?? '');
  const potSize = Math.max(input.potSize, 1);
  const stackSize = Math.max(input.stackSize, 1);
  const facingBet = input.facingBet ?? clamp(Math.round(potSize * 0.45), 2, Math.max(2, Math.round(stackSize * 0.35)));
  const spr = stackSize / potSize;
  const postflop = boardCards.length > 0 ? estimatePostflop(holeCards, boardCards) : null;
  const equity = postflop?.equity ?? estimatePreflopEquity(holeCards, input.position, input.seats);
  const potOdds = facingBet / (potSize + facingBet);
  const foldEquity = estimateFoldEquity(input, spr, equity);
  const raiseSize = clamp(potSize * 0.72, facingBet * 2.4, stackSize);
  const callEv = equity * (potSize + facingBet) - (1 - equity) * facingBet;
  const raiseEv = foldEquity * potSize + (1 - foldEquity) * (equity * (potSize + raiseSize) - (1 - equity) * raiseSize);

  let recommendation: PlayerAction = 'Fold';
  if (raiseEv > callEv + 3 && (equity > 0.46 || foldEquity > 0.42)) {
    recommendation = 'Raise';
  } else if (callEv > -1.5 && equity >= potOdds * 0.92) {
    recommendation = 'Call';
  }

  if (spr < 1.7 && equity > 0.5) recommendation = 'Raise';
  if (boardCards.length === 0 && equity > 0.46) recommendation = 'Raise';

  const confidence = clamp(Math.abs(Math.max(callEv, raiseEv) - Math.min(callEv, raiseEv, 0)) / Math.max(potSize, 1), 0.18, 0.94);
  const handClass = postflop?.handClass ?? 'preflop range candidate';
  const texture = postflop?.texture ?? `${input.seats ?? 6}-max preflop, ${input.position ?? 'unknown'} position`;
  const reasoning = `${recommendation} grades best from estimated equity ${formatPercent(equity)}, pot odds ${formatPercent(
    potOdds,
  )}, fold equity ${formatPercent(foldEquity)}, and SPR ${spr.toFixed(1)}.`;
  const resultBase = { recommendation, spr, equity, foldEquity };

  return {
    recommendation,
    equity,
    potOdds,
    spr,
    foldEquity,
    callEv,
    raiseEv,
    confidence,
    handClass,
    texture,
    reasoning,
    drills: generateDrills(input, resultBase),
  };
};

export const buildCustomGameRecommendation = (input: {
  format: string;
  seats: number;
  stackDepth: number;
  blindLevel: string;
  focus: string;
  difficulty: string;
  opponentStyle: string;
  anteLevel: string;
  tablePressure: string;
}) => {
  const pressure = input.stackDepth <= 25 ? 'short-stack pressure' : input.stackDepth >= 150 ? 'deep-stack leverage' : 'balanced stack depth';
  const anteBoost = input.anteLevel === 'Big blind ante' ? 1.5 : input.anteLevel === 'Table antes' ? 2.5 : 0;
  const basePot = (input.focus === 'Preflop ranges' ? 3 : input.focus === 'River bluffing' ? 72 : input.focus === 'Turn pressure' ? 44 : input.focus === 'Bluff catching' ? 58 : 28) + anteBoost;
  const sampleByFocus: Record<string, { hand: string; board: string }> = {
    'Preflop ranges': { hand: 'QsJs', board: '' },
    'Continuation betting': { hand: 'KdQd', board: 'Qh7d2s' },
    'Turn pressure': { hand: 'JcJs', board: 'Ts8s3dQh' },
    'River bluffing': { hand: 'As5s', board: 'Kh9s4s2c8d' },
    'Bluff catching': { hand: 'AhJh', board: 'Kd7c3s3h2d' },
    'Thin value': { hand: 'KcQh', board: 'Qs9d4c2s6h' },
  };
  const sample = sampleByFocus[input.focus] ?? sampleByFocus['Preflop ranges'];
  const advisor = estimateRecommendation({
    holeCards: sample.hand,
    boardCards: sample.board,
    potSize: basePot,
    stackSize: input.stackDepth,
    position: input.seats <= 2 ? 'BTN' : 'CO',
    focus: input.focus,
    difficulty: input.difficulty,
    seats: input.seats,
    format: input.format,
    opponentStyle: input.opponentStyle,
    anteLevel: input.anteLevel,
    tablePressure: input.tablePressure,
  });

  return {
    ...advisor,
    summary: `${input.format} at ${input.blindLevel}, ${input.seats}-max, ${pressure}, ${input.anteLevel.toLowerCase()}, versus ${input.opponentStyle.toLowerCase()}. Start with ${sample.hand}${
      sample.board ? ` on ${sample.board}` : ''
    } as the benchmark hand.`,
  };
};
