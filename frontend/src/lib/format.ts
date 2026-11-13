export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
export const formatEv = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)} bb`;
