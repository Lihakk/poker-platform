import { Hand } from "pokersolver";
import { DECK, estimateEquity } from "./equity";
import { clamp, requiredEquity } from "./pokerMath";

export interface Seat {
  id: number;
  name: string;
  profile: string;
  cards: string[];
  stack: number;
  bet: number;
  contribution: number;
  folded: boolean;
  allIn: boolean;
  canRaise: boolean;
  raiseAfter: number;
  lastAction: string;
}
export interface Table {
  seats: Seat[];
  deck: string[];
  board: string[];
  dealer: number;
  turn: number;
  street: number;
  currentBet: number;
  minRaise: number;
  pending: number[];
  hand: number;
  over: boolean;
  log: string[];
  result: string;
  pot: number;
}
export type Action = "fold" | "check" | "call" | "raise";
export const PROFILES = [
  "Balanced regular",
  "Loose-passive",
  "Aggressive regular",
  "Tight caller",
];
const nextLive = (seats: Seat[], from: number) => {
  for (let step = 1; step <= seats.length; step++) {
    const i = (from + step) % seats.length;
    if (seats[i].stack > 0) return i;
  }
  return from;
};
const shuffled = (random: () => number) => {
  const deck = [...DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
export const amountToCall = (table: Table, id = table.turn) =>
  Math.min(
    table.seats[id].stack,
    Math.max(0, table.currentBet - table.seats[id].bet),
  );
export const minimumRaiseTo = (table: Table) =>
  table.currentBet + table.minRaise;
export const canRaise = (table: Table, id = table.turn) =>
  !table.over &&
  !table.seats[id].folded &&
  !table.seats[id].allIn &&
  table.seats[id].canRaise &&
  table.seats[id].stack + table.seats[id].bet > table.currentBet &&
  table.seats.some((seat) => seat.id !== id && !seat.folded && !seat.allIn);
export const liveSeats = (table: Table) =>
  table.seats.filter((seat) => !seat.folded);

// A short stack cannot win contribution layers above its final all-in amount.
export function eligiblePotForCall(table: Table, id = table.turn) {
  const cap = table.seats[id].contribution + amountToCall(table, id);
  return table.seats.reduce(
    (sum, seat) => sum + Math.min(cap, seat.contribution),
    0,
  );
}

export function newHand(
  players: number,
  stack: number,
  hand = 1,
  previous?: Table,
  profile = "Mixed table",
  random = Math.random,
): Table {
  const seats: Seat[] = Array.from(
    { length: previous?.seats.length ?? players + 1 },
    (_, id) => ({
      id,
      name: id === 0 ? "You" : `Opponent ${id}`,
      profile:
        id === 0
          ? "Learner"
          : profile === "Mixed table"
            ? PROFILES[(id - 1) % PROFILES.length]
            : profile,
      cards: [],
      stack: previous?.seats[id].stack ?? stack,
      bet: 0,
      contribution: 0,
      folded: (previous?.seats[id].stack ?? stack) <= 0,
      allIn: false,
      canRaise: true,
      raiseAfter: 0,
      lastAction: "Waiting",
    }),
  );
  const dealer = previous ? nextLive(seats, previous.dealer) : 0;
  const deck = shuffled(random);
  seats
    .filter((seat) => !seat.folded)
    .forEach((seat) => {
      seat.cards = [deck.pop()!, deck.pop()!];
    });
  const headsUp = seats.filter((seat) => !seat.folded).length === 2;
  const sb = headsUp ? dealer : nextLive(seats, dealer);
  const bb = nextLive(seats, sb);
  for (const [id, amount] of [
    [sb, 0.5],
    [bb, 1],
  ]) {
    const paid = Math.min(amount, seats[id].stack);
    seats[id].stack -= paid;
    seats[id].bet = paid;
    seats[id].contribution = paid;
    seats[id].allIn = seats[id].stack === 0;
    seats[id].lastAction = id === sb ? "Small blind" : "Big blind";
  }
  const table: Table = {
    seats,
    deck,
    board: [],
    dealer,
    turn: (bb + 1) % seats.length,
    street: 0,
    currentBet: 1,
    minRaise: 1,
    pending: seats
      .filter((seat) => !seat.folded && !seat.allIn)
      .map((seat) => seat.id),
    hand,
    over: false,
    log: [
      `Hand ${hand}. ${seats[dealer].name} has the button. Blinds 0.5 / 1 bb.`,
    ],
    result: "",
    pot: seats.reduce((sum, seat) => sum + seat.bet, 0),
  };
  table.turn = findPending(table, bb);
  return table;
}

function findPending(table: Table, after: number) {
  for (let step = 1; step <= table.seats.length; step++) {
    const id = (after + step) % table.seats.length;
    if (
      table.pending.includes(id) &&
      !table.seats[id].folded &&
      !table.seats[id].allIn
    )
      return id;
  }
  return -1;
}

// Each contribution layer has its own eligible winners; unmatched chips are returned.
export function settle(table: Table): Table {
  const seats = table.seats.map((seat) => ({ ...seat }));
  const levels = [
    ...new Set(seats.map((seat) => seat.contribution).filter(Boolean)),
  ].sort((a, b) => a - b);
  const solved = new Map(
    seats
      .filter((seat) => !seat.folded)
      .map((seat) => [seat.id, Hand.solve([...seat.cards, ...table.board])]),
  );
  const messages: string[] = [];
  let previous = 0;
  for (const level of levels) {
    const paid = seats.filter((seat) => seat.contribution >= level);
    const amount = (level - previous) * paid.length;
    previous = level;
    if (paid.length === 1) {
      paid[0].stack += amount;
      messages.push(`${amount} bb uncalled returned to ${paid[0].name}.`);
      continue;
    }
    const eligible = paid.filter((seat) => !seat.folded);
    const hands = eligible.map((seat) => solved.get(seat.id)!);
    const best = Hand.winners(hands);
    const winners = eligible.filter((seat) =>
      best.includes(solved.get(seat.id)!),
    );
    // Odd chips go to the first winner clockwise from the button.
    winners.sort(
      (a, b) =>
        ((a.id - table.dealer - 1 + seats.length) % seats.length) -
        ((b.id - table.dealer - 1 + seats.length) % seats.length),
    );
    const halfChips = Math.round(amount * 2);
    const share = Math.floor(halfChips / winners.length) / 2;
    winners.forEach((seat, i) => {
      seat.stack += share + (i < halfChips % winners.length ? 0.5 : 0);
      seat.lastAction = "Won pot";
    });
    messages.push(
      `${level === levels[0] ? "Main" : "Side"} pot ${amount} bb: ${winners.map((seat) => `${seat.name} (${solved.get(seat.id)!.descr})`).join(", ")}.`,
    );
  }
  return {
    ...table,
    seats,
    over: true,
    turn: -1,
    pending: [],
    street: 4,
    pot: 0,
    result: messages.join(" "),
    log: [...messages, ...table.log],
  };
}

function advance(table: Table): Table {
  if (table.over) return table;
  if (liveSeats(table).length === 1) {
    const winner = liveSeats(table)[0];
    const result = `${winner.name} wins ${table.pot} bb. Everyone else folded.`;
    return {
      ...table,
      seats: table.seats.map((seat) =>
        seat.id === winner.id
          ? { ...seat, stack: seat.stack + table.pot, lastAction: "Won pot" }
          : seat,
      ),
      pot: 0,
      over: true,
      turn: -1,
      pending: [],
      result,
      log: [result, ...table.log],
    };
  }
  const actionable = liveSeats(table).filter((seat) => !seat.allIn);
  if (
    actionable.length <= 1 &&
    actionable.every((seat) => seat.bet >= table.currentBet)
  )
    table.pending = [];
  if (table.pending.length) return table;
  if (actionable.length <= 1 || table.street === 3) {
    while (table.board.length < 5) table.board.push(table.deck.pop()!);
    return settle(table);
  }
  table.deck.pop();
  const count = table.street === 0 ? 3 : 1;
  for (let i = 0; i < count; i++) table.board.push(table.deck.pop()!);
  table.street++;
  table.currentBet = 0;
  table.minRaise = 1;
  table.seats.forEach((seat) => {
    seat.bet = 0;
    seat.canRaise = true;
    seat.raiseAfter = 0;
  });
  table.pending = actionable.map((seat) => seat.id);
  table.turn = findPending(table, table.dealer);
  table.log.unshift(
    `${["Preflop", "Flop", "Turn", "River"][table.street]}: ${table.board.join(" ")}.`,
  );
  return table;
}

export function act(current: Table, action: Action, target = 0): Table {
  if (current.over || current.turn < 0) return current;
  const table: Table = {
    ...current,
    seats: current.seats.map((seat) => ({ ...seat, cards: [...seat.cards] })),
    board: [...current.board],
    deck: [...current.deck],
    pending: [...current.pending],
    log: [...current.log],
  };
  const seat = table.seats[table.turn];
  const cost = amountToCall(table);
  if (action === "check" && cost > 0)
    throw new Error("A check is not legal facing a bet.");
  if (action === "raise") {
    if (!Number.isFinite(target)) throw new Error("Enter a valid bet size.");
    if (!canRaise(table))
      throw new Error("Betting has not reopened, or no opponent can call.");
    target = Math.min(seat.stack + seat.bet, Math.round(target * 2) / 2);
    if (
      target <= table.currentBet ||
      (target < minimumRaiseTo(table) && target !== seat.stack + seat.bet)
    )
      throw new Error("Raise below the legal minimum.");
    const increment = target - table.currentBet;
    if (increment >= table.minRaise) {
      table.minRaise = increment;
      table.seats.forEach((other) => {
        if (other.id !== seat.id) other.canRaise = true;
      });
      table.pending = table.seats
        .filter(
          (other) => other.id !== seat.id && !other.folded && !other.allIn,
        )
        .map((other) => other.id);
    } else {
      table.seats.forEach((other) => {
        if (target >= other.raiseAfter) other.canRaise = true;
      });
      table.pending = [
        ...new Set([
          ...table.pending,
          ...table.seats
            .filter(
              (other) =>
                other.id !== seat.id &&
                !other.folded &&
                !other.allIn &&
                other.bet < target,
            )
            .map((other) => other.id),
        ]),
      ];
    }
    table.currentBet = target;
  }
  if (action === "fold") {
    seat.folded = true;
    seat.lastAction = "Fold";
  } else {
    const paid =
      action === "raise" ? target - seat.bet : action === "call" ? cost : 0;
    seat.stack -= paid;
    seat.bet += paid;
    seat.contribution += paid;
    table.pot += paid;
    seat.allIn = seat.stack === 0;
    seat.lastAction =
      action === "raise"
        ? `${seat.allIn ? "All-in" : current.currentBet ? "Raise to" : "Bet"} ${seat.bet} bb`
        : paid
          ? `Call ${paid} bb${seat.allIn ? " (all-in)" : ""}`
          : "Check";
  }
  seat.canRaise = action === "check";
  seat.raiseAfter = table.currentBet + table.minRaise;
  table.pending = table.pending.filter(
    (id) => id !== seat.id && !table.seats[id].folded && !table.seats[id].allIn,
  );
  table.log.unshift(`${seat.name}: ${seat.lastAction}.`);
  table.turn = findPending(table, seat.id);
  return advance(table);
}

export function aiDecision(
  table: Table,
  random = Math.random,
): { action: Action; target?: number; reason: string } {
  const seat = table.seats[table.turn];
  const cost = amountToCall(table);
  const profile = seat.profile.toLowerCase();
  const opponents = liveSeats(table).length - 1;
  const read = estimateEquity(
    seat.cards,
    table.board,
    "Balanced regular",
    opponents,
    100,
    cost > 0,
  );
  const odds = requiredEquity(eligiblePotForCall(table), cost);
  const aggression = profile.includes("aggressive")
    ? 0.7
    : profile.includes("passive")
      ? 0.15
      : profile.includes("tight")
        ? 0.3
        : 0.45;
  const threshold = clamp(1 / (opponents + 1) + 0.2, 0.35, 0.72);
  const bluff =
    table.board.length < 5 &&
    read.equity > 0.24 &&
    random() < (aggression * 0.12) / opponents;
  const valueRaise = read.equity > threshold && random() < aggression + 0.2;
  const target = Math.min(
    seat.stack + seat.bet,
    Math.max(
      minimumRaiseTo(table),
      table.currentBet +
        Math.round(table.pot * (read.equity > 0.7 ? 0.9 : 0.55)),
    ),
  );
  if (canRaise(table) && (valueRaise || bluff))
    return {
      action: "raise",
      target,
      reason: `${seat.name} ${bluff && !valueRaise ? "semi-bluffs" : "bets for value"}: sampled equity ${Math.round(read.equity * 100)}%, ${opponents} opponent${opponents > 1 ? "s" : ""}; ${seat.profile} selects ${target} bb.`,
    };
  const margin = profile.includes("passive")
    ? -0.06
    : profile.includes("tight")
      ? 0.05
      : 0;
  if (cost && read.equity < odds + margin)
    return {
      action: "fold",
      reason: `${seat.name} folds: estimated ${Math.round(read.equity * 100)}% equity versus ${Math.round(odds * 100)}% required; ${seat.profile} adjustment ${Math.round(margin * 100)} points.`,
    };
  return {
    action: cost ? "call" : "check",
    reason: `${seat.name} ${cost ? "calls" : "checks"}: estimated ${Math.round(read.equity * 100)}% equity${cost ? `, price ${Math.round(odds * 100)}%` : ", keeps the pot controlled"}.`,
  };
}

export function runToHero(initial: Table, random = Math.random): Table {
  let table = advance({
    ...initial,
    seats: initial.seats.map((seat) => ({ ...seat })),
    deck: [...initial.deck],
    board: [...initial.board],
    pending: [...initial.pending],
    log: [...initial.log],
  });
  for (let limit = 0; !table.over && table.turn !== 0 && limit < 200; limit++) {
    const plan = aiDecision(table, random);
    table = act(table, plan.action, plan.target);
    table.log.unshift(plan.reason);
  }
  if (!table.over && table.turn !== 0)
    throw new Error("The opponent action limit was reached. Restart the hand.");
  return table;
}
