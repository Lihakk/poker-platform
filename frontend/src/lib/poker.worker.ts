import { runToHero, type Table } from "./holdem";
import { estimateRecommendation, type AdvisorInput } from "./pokerAdvisor";

self.onmessage = (
  event: MessageEvent<{
    id: number;
    type: "table" | "advisor";
    table?: Table;
    input?: AdvisorInput;
  }>,
) => {
  const { id, type, table, input } = event.data;
  try {
    const result =
      type === "table" ? runToHero(table!) : estimateRecommendation(input!);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error:
        error instanceof Error ? error.message : "Poker calculation failed.",
    });
  }
};
