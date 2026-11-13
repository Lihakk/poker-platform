import { Hand } from "pokersolver";
import { clamp } from "./pokerMath";

export const RANKS = "23456789TJQKA";
export const DECK = [...RANKS].flatMap((rank) =>
  [..."shdc"].map((suit) => rank + suit),
);
export const cardCodes = (text: string) =>
  text
    .replace(/\s/g, "")
    .match(/[2-9TJQKA][shdc]/gi)
    ?.map((card) => card[0].toUpperCase() + card[1].toLowerCase()) ?? [];
export const solve = (cards: string[]) => Hand.solve(cards);

export function validateCards(hole: string[], board: string[]) {
  const cards = [...hole, ...board];
  if (hole.length !== 2 || ![0, 3, 4, 5].includes(board.length))
    throw new Error(
      "Use two hole cards and zero, three, four, or five board cards.",
    );
  if (
    cards.some((card) => !DECK.includes(card)) ||
    new Set(cards).size !== cards.length
  )
    throw new Error("Cards must be valid and unique.");
}

export function seededRandom(seed: string) {
  let value =
    [...seed].reduce(
      (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const preflopWeight = (cards: string[]) => {
  const [a, b] = cards.map((card) => RANKS.indexOf(card[0]) + 2);
  const pair = a === b;
  return clamp(
    pair
      ? 0.38 + a / 22
      : (a + b) / 35 +
          (cards[0][1] === cards[1][1] ? 0.12 : 0) -
          Math.abs(a - b) / 45,
    0.06,
    1,
  );
};

export function startingClass(cards: string[]) {
  const ordered = [...cards].sort(
    (a, b) => RANKS.indexOf(b[0]) - RANKS.indexOf(a[0]),
  );
  return (
    ordered[0][0] +
    ordered[1][0] +
    (ordered[0][0] === ordered[1][0]
      ? ""
      : ordered[0][1] === ordered[1][1]
        ? "s"
        : "o")
  );
}

export interface EquityEstimate {
  equity: number;
  trials: number;
  error: number;
  range: string;
  handClass: string;
}
const cache = new Map<string, EquityEstimate>();

export function estimateEquity(
  hole: string[],
  board: string[],
  profile = "Balanced regular",
  opponents = 1,
  trials = 300,
  facing = false,
  customRange?: string[],
): EquityEstimate {
  validateCards(hole, board);
  opponents = clamp(Math.round(opponents), 1, 5);
  trials = clamp(Math.round(trials), 30, 5000);
  const key = JSON.stringify([
    hole,
    board,
    profile,
    opponents,
    trials,
    facing,
    customRange,
  ]);
  const cached = cache.get(key);
  if (cached) return cached;
  const random = seededRandom(key);
  const available = DECK.filter(
    (card) => !hole.includes(card) && !board.includes(card),
  );
  const style = profile.toLowerCase();
  const tight = style.includes("tight");
  const loose = style.includes("loose") || style.includes("sticky");
  const range = customRange
    ? `Custom range: ${customRange.length} selected hand classes`
    : tight
      ? "Tighter, high-card and pair weighted"
      : loose
        ? "Wide, with weak pairs and suited hands"
        : "Broadway, pair and suited-hand weighted";
  const combos: { cards: string[]; cumulative: number }[] = [];
  let total = 0;
  for (let a = 0; a < available.length; a++)
    for (let b = a + 1; b < available.length; b++) {
      const cards = [available[a], available[b]];
      if (customRange && !customRange.includes(startingClass(cards))) continue;
      const strength = preflopWeight(cards);
      let weight = customRange
        ? 1
        : loose
          ? 0.3 + strength
          : Math.pow(strength, tight ? 5 : 3);
      if (facing && !customRange && board.length >= 3) {
        const rank = solve([...cards, ...board]).rank;
        const suitCounts = [...cards, ...board].reduce<Record<string, number>>(
          (all, card) => ({ ...all, [card[1]]: (all[card[1]] ?? 0) + 1 }),
          {},
        );
        const draw = board.length < 5 && Object.values(suitCounts).includes(4);
        weight *=
          rank >= 3 ? 3 : rank === 2 ? 1.6 : draw ? 1.2 : loose ? 0.65 : 0.2;
      }
      total += weight;
      combos.push({ cards, cumulative: total });
    }
  if (!combos.length)
    throw new Error(
      "No opponent combinations remain after card removal. Widen the range.",
    );
  let sum = 0;
  let squares = 0;
  for (let trial = 0; trial < trials; trial++) {
    const used = new Set<string>();
    const villains: string[][] = [];
    for (let player = 0; player < opponents; player++) {
      let combo: string[];
      let attempts = 0;
      do {
        if (++attempts > 2000)
          throw new Error(
            "This range is too narrow for that many opponents. Widen the range or reduce the player count.",
          );
        const target = random() * total;
        let lo = 0;
        let hi = combos.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (combos[mid].cumulative < target) lo = mid + 1;
          else hi = mid;
        }
        combo = combos[lo].cards;
      } while (combo.some((card) => used.has(card)));
      combo.forEach((card) => used.add(card));
      villains.push(combo);
    }
    const pool = available.filter((card) => !used.has(card));
    const runout = [...board];
    for (let i = 0; runout.length < 5; i++) {
      const index = i + Math.floor(random() * (pool.length - i));
      [pool[i], pool[index]] = [pool[index], pool[i]];
      runout.push(pool[i]);
    }
    const hero = solve([...hole, ...runout]);
    const winners = Hand.winners([
      hero,
      ...villains.map((cards) => solve([...cards, ...runout])),
    ]);
    const share = winners.includes(hero) ? 1 / winners.length : 0;
    sum += share;
    squares += share * share;
  }
  const equity = sum / trials;
  const result = {
    equity,
    trials,
    error:
      1.96 *
      Math.sqrt(Math.max(0, squares / trials - equity * equity) / trials),
    range,
    handClass: board.length
      ? solve([...hole, ...board]).descr
      : hole[0][0] === hole[1][0]
        ? "Pocket pair"
        : hole[0][1] === hole[1][1]
          ? "Suited hand"
          : "Offsuit hand",
  };
  if (cache.size > 200) cache.clear();
  cache.set(key, result);
  return result;
}
