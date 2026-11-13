import { cardCodes, estimateEquity, RANKS } from "./equity";
import { betEV, callEV, clamp, requiredEquity } from "./pokerMath";
import { formatPercent } from "./format";
export { formatPercent, formatEv } from "./format";

export type PlayerAction = "Fold" | "Call" | "Raise";
export interface AdvisorInput {
  holeCards: string;
  boardCards?: string;
  potSize: number;
  callPotSize?: number;
  allowRaise?: boolean;
  stackSize: number;
  position?: string;
  facingBet?: number;
  opponentStyle?: string;
  focus?: string;
  difficulty?: string;
  seats?: number;
  opponents?: number;
  format?: string;
  anteLevel?: string;
  tablePressure?: string;
  raiseSize?: number;
  customRange?: string[];
  trials?: number;
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
  trials: number;
  error: number;
  range: string;
}
export const parseCards = (cards: string) =>
  cardCodes(cards).map((code) => ({
    rank: code[0],
    suit: code[1],
    value: RANKS.indexOf(code[0]) + 2,
  }));

export function estimateRecommendation(input: AdvisorInput): AdvisorResult {
  const hole = cardCodes(input.holeCards);
  const board = cardCodes(input.boardCards ?? "");
  const pot = Math.max(0.01, input.potSize);
  const stack = Math.max(0, input.stackSize);
  const facing = Math.min(
    stack,
    Math.max(0, input.facingBet ?? Math.round(pot * 0.4)),
  );
  const opponents = input.opponents ?? 1;
  const simulation = estimateEquity(
    hole,
    board,
    input.opponentStyle,
    opponents,
    input.trials ?? 300,
    facing > 0,
    input.customRange,
  );
  const equity = simulation.equity;
  const spr = stack / pot;
  const callPot = Math.max(0, input.callPotSize ?? pot);
  const potOdds = requiredEquity(callPot, facing);
  const raise = Math.min(
    stack,
    Math.max(facing, input.raiseSize ?? Math.max(facing * 2, pot * 0.72)),
  );
  const style = input.opponentStyle?.toLowerCase() ?? "";
  // Fold frequency is a modeling assumption, not a solver output.
  const baseFolds = style.includes("tight")
    ? 0.45
    : style.includes("loose") || style.includes("sticky")
      ? 0.18
      : 0.32;
  const foldEquity =
    stack <= facing
      ? 0
      : clamp(
          (baseFolds + Math.log2(1 + raise / pot) * 0.12) ** opponents,
          0.02,
          0.8,
        );
  const callEv = callEV(callPot, facing, equity);
  const raiseEv =
    stack <= facing
      ? callEv
      : betEV(pot, raise, Math.max(0, raise - facing), equity, foldEquity);
  const recommendation: PlayerAction =
    input.allowRaise !== false && raiseEv > Math.max(0, callEv)
      ? "Raise"
      : callEv >= 0
        ? "Call"
        : "Fold";
  const suits = new Set(board.map((card) => card[1])).size;
  const paired = new Set(board.map((card) => card[0])).size < board.length;
  const texture = board.length
    ? `${paired ? "paired" : "unpaired"}, ${suits < Math.min(board.length, 3) ? "suited" : "rainbow"}`
    : "preflop";
  const label =
    recommendation === "Call" && facing === 0
      ? "Check"
      : recommendation === "Raise" && facing === 0
        ? "Bet"
        : recommendation;
  return {
    recommendation,
    equity,
    potOdds,
    spr,
    foldEquity,
    callEv,
    raiseEv,
    confidence: 1 - simulation.error,
    handClass: simulation.handClass,
    texture,
    trials: simulation.trials,
    error: simulation.error,
    range: simulation.range,
    reasoning: `${label} has the highest estimated immediate EV among the available actions. Calling ${facing.toFixed(1)} bb into ${callPot.toFixed(1)} bb of contestable pot needs ${formatPercent(potOdds)} equity; ${simulation.trials} sampled showdowns estimate ${formatPercent(equity)} (sampling margin about ${formatPercent(simulation.error)}). ${input.allowRaise === false ? "Raising is unavailable on this action. " : `Aggression assumes ${formatPercent(foldEquity)} folds and one matching caller. `}Future bets, rake and ICM are excluded; side-pot layers share the same estimated equity.`,
    drills: [
      "Compare the estimate against a tighter and a wider opponent range.",
      "Change the bet size and find where the preferred line changes.",
      "Explain which worse hands call and which better hands fold.",
    ],
  };
}

export function buildCustomGameRecommendation(input: {
  format: string;
  seats: number;
  stackDepth: number;
  blindLevel: string;
  focus: string;
  difficulty: string;
  opponentStyle: string;
  anteLevel: string;
  tablePressure: string;
}) {
  const samples: Record<string, { hand: string; board: string; pot: number }> =
    {
      "Preflop ranges": { hand: "QsJs", board: "", pot: 7 },
      "Continuation betting": { hand: "KdQd", board: "Qh7d2s", pot: 28 },
      "Turn pressure": { hand: "JcJs", board: "Ts8s3dQh", pot: 44 },
      "River bluffing": { hand: "As5s", board: "Kh9s4s2c8d", pot: 72 },
      "Bluff catching": { hand: "AhJh", board: "Kd7c3s3h2d", pot: 58 },
      "Thin value": { hand: "KcQh", board: "Qs9d4c2s6h", pot: 84 },
    };
  const sample = samples[input.focus] ?? samples["Preflop ranges"];
  const advisor = estimateRecommendation({
    ...input,
    holeCards: sample.hand,
    boardCards: sample.board,
    potSize: sample.pot,
    stackSize: input.stackDepth,
    position: input.seats <= 2 ? "BTN" : "CO",
  });
  return {
    ...advisor,
    summary: `${input.format}, ${input.seats}-max, ${input.stackDepth} bb, versus ${input.opponentStyle.toLowerCase()}. Benchmark: ${sample.hand}${sample.board ? ` on ${sample.board}` : ""}. This benchmark is heads-up; table size, antes and tournament pressure require additional strategic adjustment.`,
  };
}
