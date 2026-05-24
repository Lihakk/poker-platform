import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { estimateRecommendation, formatEv, formatPercent, type PlayerAction } from '../lib/pokerAdvisor';

interface GameCard {
  rank: string;
  suit: string;
  code: string;
}

interface HandScore {
  name: string;
  values: number[];
}

interface Seat {
  id: string;
  name: string;
  isHero: boolean;
  profile: string;
  cards: GameCard[];
  stack: number;
  streetBet: number;
  folded: boolean;
  allIn: boolean;
  lastAction: string;
}

interface GameState {
  deck: GameCard[];
  seats: Seat[];
  board: GameCard[];
  street: number;
  pot: number;
  currentBet: number;
  minRaise: number;
  handOver: boolean;
  sessionOver: boolean;
  result: string;
  coach: string;
  log: string[];
  handNumber: number;
  targetHands: number;
}

type AiPlan =
  | { action: 'fold'; reason: string }
  | { action: 'call'; reason: string }
  | { action: 'check'; reason: string }
  | { action: 'bet'; targetBet: number; reason: string }
  | { action: 'raise'; targetBet: number; reason: string };

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['s', 'h', 'd', 'c'];
const streetNames = ['Preflop', 'Flop', 'Turn', 'River', 'Showdown'];
const profilePool = ['Balanced regular', 'Loose-passive', 'Aggressive regular', 'Tight caller', 'Short-stack pressure'];
const rankValue: Record<string, number> = {
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

const cardTextColor = (card: GameCard) => (card.suit === 'h' || card.suit === 'd' ? 'text-rose-600' : 'text-slate-950');
const cardsToString = (cards: GameCard[]) => cards.map((card) => card.code).join('');
const activeSeats = (seats: Seat[]) => seats.filter((seat) => !seat.folded && (seat.stack > 0 || seat.streetBet > 0));
const heroSeat = (seats: Seat[]) => seats.find((seat) => seat.isHero) ?? seats[0];
const toCallFor = (seat: Seat, state: GameState) => Math.max(state.currentBet - seat.streetBet, 0);

const makeDeck = () =>
  ranks.flatMap((rank) =>
    suits.map((suit) => ({
      rank,
      suit,
      code: `${rank}${suit}`,
    })),
  );

const shuffle = (cards: GameCard[]) => {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const draw = (deck: GameCard[], amount: number) => ({
  drawn: deck.slice(0, amount),
  remaining: deck.slice(amount),
});

const uniqueDescending = (values: number[]) => Array.from(new Set(values)).sort((a, b) => b - a);

const straightHigh = (values: number[]) => {
  const uniqueValues = uniqueDescending(values).flatMap((value) => (value === 14 ? [14, 1] : [value]));
  const uniqueAscending = Array.from(new Set(uniqueValues)).sort((a, b) => a - b);

  for (let high = 14; high >= 5; high -= 1) {
    const needed = [high, high - 1, high - 2, high - 3, high - 4];
    if (needed.every((value) => uniqueAscending.includes(value))) return high;
  }

  return 0;
};

const scoreHand = (cards: GameCard[]): HandScore => {
  const values = cards.map((card) => rankValue[card.rank]).sort((a, b) => b - a);
  const suitsByName = cards.reduce<Record<string, GameCard[]>>((groups, card) => {
    groups[card.suit] = [...(groups[card.suit] ?? []), card];
    return groups;
  }, {});
  const counts = values.reduce<Record<number, number>>((groups, value) => {
    groups[value] = (groups[value] ?? 0) + 1;
    return groups;
  }, {});
  const countEntries = Object.entries(counts)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
  const flushCards = Object.values(suitsByName).find((group) => group.length >= 5);
  const flushValues = flushCards ? flushCards.map((card) => rankValue[card.rank]).sort((a, b) => b - a) : [];
  const flushStraight = flushCards ? straightHigh(flushValues) : 0;

  if (flushStraight) return { name: 'Straight flush', values: [8, flushStraight] };

  const quads = countEntries.find((entry) => entry.count === 4);
  if (quads) return { name: 'Four of a kind', values: [7, quads.value, ...uniqueDescending(values.filter((value) => value !== quads.value)).slice(0, 1)] };

  const trips = countEntries.filter((entry) => entry.count === 3);
  const pairs = countEntries.filter((entry) => entry.count === 2);
  if (trips.length > 0 && (pairs.length > 0 || trips.length > 1)) return { name: 'Full house', values: [6, trips[0].value, trips[1]?.value ?? pairs[0].value] };
  if (flushCards) return { name: 'Flush', values: [5, ...flushValues.slice(0, 5)] };

  const straight = straightHigh(values);
  if (straight) return { name: 'Straight', values: [4, straight] };
  if (trips.length > 0) return { name: 'Three of a kind', values: [3, trips[0].value, ...uniqueDescending(values.filter((value) => value !== trips[0].value)).slice(0, 2)] };

  if (pairs.length >= 2) {
    const kickers = uniqueDescending(values.filter((value) => value !== pairs[0].value && value !== pairs[1].value));
    return { name: 'Two pair', values: [2, pairs[0].value, pairs[1].value, ...kickers.slice(0, 1)] };
  }

  if (pairs.length === 1) return { name: 'One pair', values: [1, pairs[0].value, ...uniqueDescending(values.filter((value) => value !== pairs[0].value)).slice(0, 3)] };

  return { name: 'High card', values: [0, ...uniqueDescending(values).slice(0, 5)] };
};

const compareScores = (first: HandScore, second: HandScore) => {
  const length = Math.max(first.values.length, second.values.length);
  for (let index = 0; index < length; index += 1) {
    const firstValue = first.values[index] ?? 0;
    const secondValue = second.values[index] ?? 0;
    if (firstValue > secondValue) return 1;
    if (firstValue < secondValue) return -1;
  }
  return 0;
};

const preflopStrength = (cards: GameCard[]) => {
  const [first, second] = cards;
  if (!first || !second) return 0;
  const high = Math.max(rankValue[first.rank], rankValue[second.rank]);
  const low = Math.min(rankValue[first.rank], rankValue[second.rank]);
  const pair = first.rank === second.rank ? 0.32 : 0;
  const suited = first.suit === second.suit ? 0.06 : 0;
  const gap = Math.max(high - low - 1, 0);
  const connected = gap === 0 ? 0.06 : gap === 1 ? 0.04 : gap === 2 ? 0.02 : -0.02;
  return Math.min(0.18 + (high + low) / 75 + pair + suited + connected, 0.95);
};

const madeHandStrength = (seat: Seat, board: GameCard[]) => {
  if (board.length === 0) return preflopStrength(seat.cards);
  const score = scoreHand([...seat.cards, ...board]);
  const category = score.values[0] ?? 0;
  const kicker = (score.values[1] ?? 8) / 14;
  return Math.min(0.12 + category / 8 + kicker * 0.18, 0.98);
};

const createSeats = (aiCount: number, startingStack: number, previousSeats?: Seat[]) => {
  const heroPrevious = previousSeats?.find((seat) => seat.isHero);
  const hero: Seat = {
    id: 'hero',
    name: 'Hero',
    isHero: true,
    profile: 'Human',
    cards: [],
    stack: heroPrevious?.stack ?? startingStack,
    streetBet: 0,
    folded: false,
    allIn: false,
    lastAction: 'Waiting',
  };

  const aiSeats = Array.from({ length: aiCount }, (_, index) => {
    const previous = previousSeats?.find((seat) => seat.id === `ai-${index + 1}`);
    return {
      id: `ai-${index + 1}`,
      name: `AI ${index + 1}`,
      isHero: false,
      profile: previous?.profile ?? profilePool[index % profilePool.length],
      cards: [],
      stack: previous?.stack ?? startingStack,
      streetBet: 0,
      folded: false,
      allIn: false,
      lastAction: previous && previous.stack <= 0 ? 'Eliminated' : 'Waiting',
    };
  });

  return [hero, ...aiSeats];
};

const postBlind = (seat: Seat, amount: number) => {
  const paid = Math.min(seat.stack, amount);
  return { seat: { ...seat, stack: seat.stack - paid, streetBet: paid, allIn: seat.stack - paid === 0, lastAction: `Posted ${paid} bb` }, paid };
};

const createHand = (aiCount: number, targetHands: number, startingStack: number, handNumber: number, previousSeats?: Seat[]): GameState => {
  let deck = shuffle(makeDeck());
  let pot = 0;
  const seats = createSeats(aiCount, startingStack, previousSeats).map((seat) => ({ ...seat, cards: [], streetBet: 0, folded: seat.stack <= 0, allIn: seat.stack <= 0 }));

  const dealtSeats = seats.map((seat) => {
    if (seat.stack <= 0) return { ...seat, lastAction: 'Eliminated' };
    const next = draw(deck, 2);
    deck = next.remaining;
    return { ...seat, cards: next.drawn, lastAction: 'Dealt in' };
  });

  const smallBlindIndex = aiCount === 1 ? 0 : 1;
  const bigBlindIndex = aiCount === 1 ? 1 : 2;
  const withSmallBlind = [...dealtSeats];
  const smallBlind = postBlind(withSmallBlind[smallBlindIndex], 1);
  withSmallBlind[smallBlindIndex] = smallBlind.seat;
  pot += smallBlind.paid;

  const bigBlind = postBlind(withSmallBlind[bigBlindIndex], 2);
  withSmallBlind[bigBlindIndex] = bigBlind.seat;
  pot += bigBlind.paid;

  return {
    deck,
    seats: withSmallBlind,
    board: [],
    street: 0,
    pot,
    currentBet: 2,
    minRaise: 2,
    handOver: false,
    sessionOver: false,
    result: '',
    coach: 'New hand. Choose a line based on position, price, stack depth, and how many players remain.',
    log: [`Hand ${handNumber} begins with ${aiCount} AI opponent${aiCount > 1 ? 's' : ''}. Blinds are posted.`],
    handNumber,
    targetHands,
  };
};

const payToTarget = (seat: Seat, targetBet: number) => {
  const required = Math.max(targetBet - seat.streetBet, 0);
  const paid = Math.min(required, seat.stack);
  return {
    seat: {
      ...seat,
      stack: seat.stack - paid,
      streetBet: seat.streetBet + paid,
      allIn: seat.stack - paid === 0,
    },
    paid,
  };
};

const awardByFold = (state: GameState, winnerId: string, reason: string): GameState => {
  const seats = state.seats.map((seat) => (seat.id === winnerId ? { ...seat, stack: seat.stack + state.pot, lastAction: `Won ${state.pot} bb` } : seat));
  const winner = seats.find((seat) => seat.id === winnerId);
  const result = `${winner?.name ?? 'Winner'} wins ${state.pot} bb. ${reason}`;

  return {
    ...state,
    seats,
    handOver: true,
    result,
    coach: reason,
    log: [result, ...state.log],
  };
};

const settleIfOnlyOneActive = (state: GameState) => {
  const active = activeSeats(state.seats);
  if (active.length === 1) return awardByFold(state, active[0].id, 'Everyone else folded.');
  return state;
};

const resetStreet = (state: GameState) => ({
  ...state,
  seats: state.seats.map((seat) => ({ ...seat, streetBet: 0, lastAction: seat.folded ? 'Folded' : seat.lastAction })),
  currentBet: 0,
  minRaise: 2,
});

const dealBoardToRiver = (state: GameState): GameState => {
  let deck = state.deck;
  const board = [...state.board];
  const logEntries: string[] = [];

  while (board.length < 5) {
    const nextDraw = draw(deck, 1);
    deck = nextDraw.remaining;
    board.push(...nextDraw.drawn);
    logEntries.push(`All-in runout card: ${nextDraw.drawn.map((card) => card.code).join(' ')}`);
  }

  return {
    ...state,
    deck,
    board,
    log: [...logEntries, ...state.log],
  };
};

const showdown = (state: GameState): GameState => {
  const contenders = activeSeats(state.seats);
  const scored = contenders.map((seat) => ({ seat, score: scoreHand([...seat.cards, ...state.board]) }));
  const best = scored.reduce((leader, item) => (compareScores(item.score, leader.score) > 0 ? item : leader), scored[0]);
  const winners = scored.filter((item) => compareScores(item.score, best.score) === 0);
  const share = Math.floor(state.pot / winners.length);
  const winnerNames = winners.map((item) => `${item.seat.name} (${item.score.name})`).join(', ');
  const result = winners.length === 1 ? `${winnerNames} wins ${state.pot} bb at showdown.` : `Split pot: ${winnerNames}.`;

  return {
    ...state,
    street: 4,
    handOver: true,
    result,
    coach: `Showdown reached. Winner line: ${winnerNames}. Review whether earlier betting made the pot size comfortable.`,
    seats: state.seats.map((seat) => {
      const winner = winners.find((item) => item.seat.id === seat.id);
      return winner ? { ...seat, stack: seat.stack + share, lastAction: `Won ${share} bb` } : seat;
    }),
    log: [result, ...scored.map((item) => `${item.seat.name}: ${item.score.name} with ${item.seat.cards.map((card) => card.code).join(' ')}`), ...state.log],
  };
};

const remainingPlayersAreAllIn = (state: GameState) => {
  const active = activeSeats(state.seats);
  return active.length > 1 && active.every((seat) => seat.allIn || seat.stack === 0);
};

const runoutIfAllIn = (state: GameState): GameState => {
  if (!remainingPlayersAreAllIn(state)) return state;
  return showdown(dealBoardToRiver(state));
};

const advanceStreet = (state: GameState): GameState => {
  const foldedCheck = settleIfOnlyOneActive(state);
  if (foldedCheck.handOver) return foldedCheck;
  const allInCheck = runoutIfAllIn(state);
  if (allInCheck.handOver) return allInCheck;
  if (state.street >= 3) return showdown(state);

  const drawCount = state.street === 0 ? 3 : 1;
  const nextDraw = draw(state.deck, drawCount);
  const nextStreet = state.street + 1;
  const streetReset = resetStreet({
    ...state,
    deck: nextDraw.remaining,
    board: [...state.board, ...nextDraw.drawn],
    street: nextStreet,
  });

  return {
    ...streetReset,
    coach: `${streetNames[nextStreet]} dealt. Re-evaluate equity, blockers, and which player has range advantage before acting.`,
    log: [`${streetNames[nextStreet]} dealt: ${nextDraw.drawn.map((card) => card.code).join(' ')}`, ...state.log],
  };
};

const chooseAiPlan = (seat: Seat, state: GameState): AiPlan => {
  const strength = madeHandStrength(seat, state.board);
  const facing = toCallFor(seat, state);
  const potOdds = facing / Math.max(state.pot + facing, 1);
  const profile = seat.profile.toLowerCase();
  const aggression = profile.includes('aggressive') ? 0.2 : profile.includes('short') ? 0.16 : profile.includes('loose') ? 0.08 : profile.includes('tight') ? -0.12 : 0;
  const callThreshold = potOdds + (profile.includes('loose') ? -0.12 : profile.includes('tight') ? 0.08 : 0);
  const betTarget = Math.max(2, Math.round(state.pot * (profile.includes('aggressive') ? 0.82 : profile.includes('tight') ? 0.48 : profile.includes('short') ? 1.15 : 0.62)));
  const canJam = seat.stack + seat.streetBet <= Math.max(18, state.pot * 1.35);
  const raiseThreshold = 0.68 - aggression;
  const betThreshold = 0.54 - aggression;

  if (facing > 0) {
    if (strength < callThreshold && !profile.includes('loose')) return { action: 'fold', reason: `${seat.name} folds: strength estimate ${formatPercent(strength)} is below price pressure ${formatPercent(callThreshold)}.` };
    if (strength > raiseThreshold && seat.stack > facing + state.minRaise) {
      const targetBet = canJam && strength > 0.55 ? seat.streetBet + seat.stack : state.currentBet + Math.max(state.minRaise, Math.round(state.pot * (profile.includes('aggressive') ? 0.72 : 0.5)));
      return {
        action: 'raise',
        targetBet,
        reason: `${seat.name} raises${targetBet >= seat.streetBet + seat.stack ? ' all-in' : ''}: strength ${formatPercent(strength)} clears their pressure threshold ${formatPercent(raiseThreshold)}.`,
      };
    }
    return { action: 'call', reason: `${seat.name} calls: price is acceptable for their estimated equity and profile.` };
  }

  if (strength > betThreshold) {
    const targetBet = canJam && strength > 0.62 ? seat.streetBet + seat.stack : betTarget;
    return {
      action: 'bet',
      targetBet,
      reason: `${seat.name} bets${targetBet >= seat.streetBet + seat.stack ? ' all-in' : ''}: no bet is facing them and their profile converts this strength into pressure.`,
    };
  }

  return { action: 'check', reason: `${seat.name} checks: not enough value or fold equity to build the pot.` };
};

const runAiActions = (state: GameState): GameState => {
  let nextState = state;

  for (const seat of nextState.seats) {
    const currentSeat = nextState.seats.find((item) => item.id === seat.id);
    if (!currentSeat || currentSeat.isHero || currentSeat.folded || currentSeat.allIn || nextState.handOver) continue;

    const plan = chooseAiPlan(currentSeat, nextState);
    const seatIndex = nextState.seats.findIndex((item) => item.id === currentSeat.id);

    if (plan.action === 'fold') {
      nextState.seats[seatIndex] = { ...currentSeat, folded: true, lastAction: 'Fold' };
      nextState = { ...nextState, log: [plan.reason, ...nextState.log] };
      nextState = settleIfOnlyOneActive(nextState);
      continue;
    }

    if (plan.action === 'check') {
      nextState.seats[seatIndex] = { ...currentSeat, lastAction: 'Check' };
      nextState = { ...nextState, log: [plan.reason, ...nextState.log] };
      continue;
    }

    const targetBet = plan.action === 'call' ? nextState.currentBet : Math.min(currentSeat.streetBet + currentSeat.stack, Math.max(plan.targetBet, nextState.currentBet + nextState.minRaise));
    const payment = payToTarget(currentSeat, targetBet);
    const wasAggressive = plan.action === 'bet' || plan.action === 'raise';
    const actionText = plan.action === 'call' ? `Call ${payment.paid} bb` : `${plan.action === 'bet' ? 'Bet' : 'Raise to'} ${payment.seat.streetBet} bb`;

    nextState.seats[seatIndex] = { ...payment.seat, lastAction: actionText };
    nextState = {
      ...nextState,
      pot: nextState.pot + payment.paid,
      currentBet: Math.max(nextState.currentBet, payment.seat.streetBet),
      log: [`${actionText}. ${plan.reason}`, ...nextState.log],
    };

    const allInCheck = runoutIfAllIn(nextState);
    if (allInCheck.handOver) return allInCheck;

    if (wasAggressive) {
      const hero = heroSeat(nextState.seats);
      return {
        ...nextState,
        coach: `${currentSeat.name} applied pressure. Your next decision should compare pot odds with equity and ask whether calling realizes enough equity out of position.`,
        log: [`Action is back on you facing ${toCallFor(hero, nextState)} bb.`, ...nextState.log],
      };
    }
  }

  const hero = heroSeat(nextState.seats);
  if (toCallFor(hero, nextState) > 0) return nextState;

  return advanceStreet(nextState);
};

export default function GameSimulator() {
  const [aiCount, setAiCount] = useState(3);
  const [targetHands, setTargetHands] = useState(10);
  const [startingStack, setStartingStack] = useState(100);
  const [betAmount, setBetAmount] = useState(8);
  const [handsCompleted, setHandsCompleted] = useState(0);
  const [heroWins, setHeroWins] = useState(0);
  const [game, setGame] = useState<GameState>(() => createHand(3, 10, 100, 1));

  const hero = heroSeat(game.seats);
  const heroToCall = toCallFor(hero, game);
  const advisor = useMemo(
    () =>
      estimateRecommendation({
        holeCards: cardsToString(hero.cards),
        boardCards: cardsToString(game.board),
        potSize: game.pot,
        stackSize: hero.stack,
        position: 'BTN',
        opponentStyle: 'Multiway table',
        facingBet: heroToCall,
        focus: game.street === 0 ? 'Preflop ranges' : game.street === 3 ? 'River bluffing' : 'Full hand planning',
      }),
    [game.board, game.pot, game.street, hero.cards, hero.stack, heroToCall],
  );

  const completeHand = (state: GameState) => {
    if (!state.handOver) return state;
    const completed = handsCompleted + 1;
    const heroWon = state.result.startsWith('Hero') || state.result.startsWith('You') || state.result.includes('Hero (');
    setHandsCompleted(completed);
    if (heroWon) setHeroWins((wins) => wins + 1);

    const heroAfter = heroSeat(state.seats);
    const aiAlive = state.seats.some((seat) => !seat.isHero && seat.stack > 0);
    if (completed >= state.targetHands || heroAfter.stack <= 0 || !aiAlive) {
      return {
        ...state,
        sessionOver: true,
        coach:
          completed >= state.targetHands
            ? 'Session complete. Review your biggest pots and compare them with the recommendation panel.'
            : heroAfter.stack <= 0
              ? 'Session ended because your stack hit zero. Review the largest losing decisions.'
              : 'Session ended because every AI stack was beaten.',
      };
    }

    return state;
  };

  const updateGame = (next: GameState) => completeHand(next);

  const startSession = () => {
    setHandsCompleted(0);
    setHeroWins(0);
    setGame(createHand(aiCount, targetHands, startingStack, 1));
  };

  const nextHand = () => {
    const nextHandNumber = game.handNumber + 1;
    setGame(createHand(aiCount, targetHands, startingStack, nextHandNumber, game.seats));
  };

  const takeAction = (action: PlayerAction | 'AllIn') => {
    if (game.handOver || game.sessionOver) return;

    setGame((current) => {
      const currentHero = heroSeat(current.seats);
      const heroIndex = current.seats.findIndex((seat) => seat.id === currentHero.id);
      const facing = toCallFor(currentHero, current);

      if (action === 'Fold') {
        const foldedSeats = current.seats.map((seat) => (seat.isHero ? { ...seat, folded: true, lastAction: 'Fold' } : seat));
        const next = settleIfOnlyOneActive({
          ...current,
          seats: foldedSeats,
          coach: 'Fold chosen. Good folds protect stack when price, equity, or realization are not there.',
          log: ['Hero folds. The pot is awarded to the remaining player if only one remains.', ...current.log],
        });
        return updateGame(next.handOver ? next : awardByFold(next, activeSeats(next.seats).find((seat) => !seat.isHero)?.id ?? next.seats[1].id, 'Hero folded.'));
      }

      const target =
        action === 'Call'
          ? current.currentBet
          : action === 'AllIn'
            ? currentHero.streetBet + currentHero.stack
            : Math.min(currentHero.streetBet + currentHero.stack, Math.max(betAmount, current.currentBet + current.minRaise));
      const payment = payToTarget(currentHero, target);
      const seats = [...current.seats];
      seats[heroIndex] = {
        ...payment.seat,
        lastAction:
          action === 'Call'
            ? facing > 0
              ? `Call ${payment.paid} bb`
              : 'Check'
            : action === 'AllIn'
              ? `All-in ${payment.seat.streetBet} bb`
              : `${current.currentBet > 0 ? 'Raise to' : 'Bet'} ${payment.seat.streetBet} bb`,
      };
      const recommendationMatch = action === advisor.recommendation || ((action === 'Raise' || action === 'AllIn') && advisor.recommendation === 'Raise');
      let nextState: GameState = {
        ...current,
        seats,
        pot: current.pot + payment.paid,
        currentBet: Math.max(current.currentBet, payment.seat.streetBet),
        coach: recommendationMatch
          ? `Your ${action.toLowerCase()} matches the model's aggressive line. ${advisor.reasoning}`
          : `Model prefers ${advisor.recommendation}. ${advisor.reasoning}`,
        log: [
          `Hero ${
            action === 'Call'
              ? facing > 0
                ? `calls ${payment.paid} bb`
                : 'checks'
              : action === 'AllIn'
                ? `moves all-in for ${payment.seat.streetBet} bb`
                : `${current.currentBet > 0 ? 'raises to' : 'bets'} ${payment.seat.streetBet} bb`
          }.`,
          ...current.log,
        ],
      };

      const allInCheck = runoutIfAllIn(nextState);
      if (allInCheck.handOver) return updateGame(allInCheck);

      if (action === 'Call' && facing > 0 && activeSeats(nextState.seats).every((seat) => seat.folded || seat.streetBet === nextState.currentBet || seat.allIn)) {
        return updateGame(advanceStreet(nextState));
      }

      nextState = runAiActions(nextState);
      return updateGame(nextState);
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-300">Full Game Simulation</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Multiway Hold'em Table Trainer</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Configure AI player count, play finite sessions, choose exact bet sizes, face AI bets and raises, and review every decision with EV-based coaching.
            </p>
          </section>

          <aside className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-100">Session</p>
            <p className="mt-2 text-3xl font-black">
              {handsCompleted} / {game.targetHands}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Hero wins: {heroWins}. Current hand: {game.handNumber}.
            </p>
          </aside>
        </div>

        <div className="mb-6 grid gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5 lg:grid-cols-4">
          <NumberSetting label="AI players" value={aiCount} min={1} max={5} onChange={setAiCount} />
          <NumberSetting label="Session hands" value={targetHands} min={1} max={50} onChange={setTargetHands} />
          <NumberSetting label="Starting stack" value={startingStack} min={20} max={300} onChange={setStartingStack} />
          <button onClick={startSession} className="rounded-lg bg-teal-600 px-5 py-3 font-black text-white transition hover:bg-teal-500">
            Start New Session
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{streetNames[game.street]}</p>
                <h2 className="mt-2 text-2xl font-black">Pot: {game.pot} bb</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Current bet: {game.currentBet} bb. You face {heroToCall} bb.
                </p>
              </div>
              <div className="rounded-md bg-slate-950 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-widest text-slate-500">Hero stack</p>
                <p className="text-xl font-black">{hero.stack} bb</p>
              </div>
            </div>

            <div className="py-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Board</p>
              <div className="mb-8 flex min-h-20 flex-wrap gap-3">
                {game.board.length > 0 ? game.board.map((card) => <CardTile key={card.code} card={card} size="board" />) : <p className="rounded-md bg-slate-950 px-4 py-3 text-slate-500">No board yet</p>}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {game.seats.map((seat) => (
                  <SeatPanel key={seat.id} seat={seat} reveal={game.handOver || seat.isHero} board={game.board} />
                ))}
              </div>
            </div>

            {game.result && <div className="mb-5 rounded-lg border border-teal-500/30 bg-teal-500/10 p-5 text-lg font-bold text-teal-100">{game.result}</div>}
            {game.sessionOver && <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">Session ended. Start a new session to continue with fresh settings.</div>}

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <NumberSetting label="Bet / raise to" value={betAmount} min={2} max={Math.max(hero.stack + hero.streetBet, 2)} onChange={setBetAmount} />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <button onClick={() => takeAction('Fold')} disabled={game.handOver || game.sessionOver} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-bold text-slate-100 transition hover:border-rose-300 disabled:opacity-40">
                    Fold
                  </button>
                  <button onClick={() => takeAction('Call')} disabled={game.handOver || game.sessionOver} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-bold text-slate-100 transition hover:border-blue-300 disabled:opacity-40">
                    {heroToCall > 0 ? `Call ${heroToCall}` : 'Check'}
                  </button>
                  <button onClick={() => takeAction('Raise')} disabled={game.handOver || game.sessionOver} className="rounded-lg bg-teal-600 px-4 py-3 font-bold text-white transition hover:bg-teal-500 disabled:opacity-40">
                    {game.currentBet > 0 ? 'Raise' : 'Bet'}
                  </button>
                  <button onClick={() => takeAction('AllIn')} disabled={game.handOver || game.sessionOver || hero.stack <= 0} className="rounded-lg bg-rose-700 px-4 py-3 font-bold text-white transition hover:bg-rose-600 disabled:opacity-40">
                    All-in
                  </button>
                  <button onClick={nextHand} disabled={!game.handOver || game.sessionOver} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-bold text-slate-100 transition hover:border-teal-300 disabled:opacity-40">
                    Next Hand
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Decision explanation</p>
              <p className="mt-2 text-slate-200">{game.coach}</p>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Model recommendation</p>
              <p className="mt-2 text-3xl font-black text-teal-200">{advisor.recommendation}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{advisor.reasoning}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Metric label="Equity" value={formatPercent(advisor.equity)} />
                <Metric label="Pot odds" value={formatPercent(advisor.potOdds)} />
                <Metric label="Call EV" value={formatEv(advisor.callEv)} />
                <Metric label="Raise EV" value={formatEv(advisor.raiseEv)} />
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Action log</p>
              <div className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
                {game.log.map((entry, index) => (
                  <p key={`${entry}-${index}`} className="rounded-md bg-slate-950 p-3 text-sm text-slate-300">
                    {entry}
                  </p>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function CardTile({ card, size }: { card: GameCard; size: 'hand' | 'board' }) {
  const dimensions = size === 'hand' ? 'h-24 w-16 text-2xl' : 'h-20 w-14 text-xl';
  return <div className={`grid ${dimensions} place-items-center rounded-md bg-white font-black shadow-lg ${cardTextColor(card)}`}>{card.code}</div>;
}

function SeatPanel({ seat, reveal, board }: { seat: Seat; reveal: boolean; board: GameCard[] }) {
  const score = seat.cards.length > 0 && (reveal || seat.isHero) && board.length >= 3 ? scoreHand([...seat.cards, ...board]).name : '';

  return (
    <article className={`rounded-lg border p-4 ${seat.folded ? 'border-slate-800 bg-slate-950/60 opacity-60' : seat.isHero ? 'border-teal-400 bg-teal-500/10' : 'border-slate-800 bg-slate-950'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{seat.name}</p>
          <p className="text-xs text-slate-500">{seat.profile}</p>
        </div>
        <div className="text-right">
          <p className="font-black">{seat.stack} bb</p>
          <p className="text-xs text-slate-500">bet {seat.streetBet}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {seat.cards.length > 0 ? (
          seat.cards.map((card) =>
            reveal ? <CardTile key={card.code} card={card} size="hand" /> : <div key={card.code} className="grid h-24 w-16 place-items-center rounded-md bg-slate-800 text-xl font-black text-slate-500">?</div>,
          )
        ) : (
          <p className="rounded-md bg-slate-900 px-3 py-2 text-sm text-slate-500">Out</p>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-400">{seat.lastAction}</p>
      {score && <p className="mt-2 text-sm font-bold text-teal-200">{score}</p>}
    </article>
  );
}

function NumberSetting({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Math.min(Math.max(Number(event.target.value), min), max))}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-bold text-white outline-none focus:border-teal-300"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-950 p-3">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}
