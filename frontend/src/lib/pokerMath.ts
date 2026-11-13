export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Pot is the chips already in the middle, INCLUDING the opponent's bet.
export const callEV = (pot: number, cost: number, equity: number) =>
  equity * (pot + cost) - cost;
export const requiredEquity = (pot: number, cost: number) =>
  cost / Math.max(1, pot + cost);
export const betEV = (
  pot: number,
  cost: number,
  opponentCall: number,
  equity: number,
  folds: number,
) => folds * pot + (1 - folds) * (equity * (pot + cost + opponentCall) - cost);

export const bluffBreakEven = (pot: number, cost: number) =>
  cost / Math.max(1, pot + cost);
