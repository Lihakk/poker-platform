import { describe, expect, it } from "vitest";
import { callEV, betEV, requiredEquity } from "./pokerMath";
import { estimateRecommendation } from "./pokerAdvisor";
import { estimateEquity, seededRandom, solve, validateCards } from "./equity";
import {
  act,
  amountToCall,
  canRaise,
  eligiblePotForCall,
  minimumRaiseTo,
  newHand,
  runToHero,
  settle,
  aiDecision,
  type Table,
} from "./holdem";

describe("EV accounting", () => {
  it("uses the pot including the opponent bet", () => {
    expect(requiredEquity(75, 25)).toBe(0.25);
    expect(callEV(75, 25, 0.25)).toBe(0);
    expect(callEV(75, 25, 0.3)).toBe(5);
    expect(callEV(75, 25, 0)).toBe(-25);
    expect(callEV(75, 25, 1)).toBe(75);
  });
  it("counts only the opponent additional payment after a raise", () => {
    expect(betEV(100, 50, 50, 0, 1 / 3)).toBeCloseTo(0);
    expect(betEV(100, 60, 40, 0.5, 0)).toBe(40);
  });
  it("uses the exact chosen investment and restricts unavailable raises", () => {
    const input = {
      holeCards: "AsAh",
      potSize: 20,
      stackSize: 100,
      facingBet: 7,
      raiseSize: 10,
      trials: 30,
    };
    const read = estimateRecommendation(input);
    expect(read.raiseEv).toBe(betEV(20, 10, 3, read.equity, read.foldEquity));
    expect(
      estimateRecommendation({ ...input, allowRaise: false }).recommendation,
    ).not.toBe("Raise");
  });
});

describe("evaluated equity", () => {
  it("recognizes wheels, full houses and quads", () => {
    expect(solve(["As", "2h", "3d", "4c", "5s", "Kd", "Qh"]).name).toBe(
      "Straight",
    );
    expect(solve(["As", "Ah", "Ad", "Kc", "Ks", "Kd", "2h"]).name).toBe(
      "Full House",
    );
    expect(solve(["As", "Ah", "Ad", "Ac", "Ks", "2d", "3h"]).name).toBe(
      "Four of a Kind",
    );
  });
  it("rejects duplicate cards and incomplete boards", () => {
    expect(() => validateCards(["As", "As"], [])).toThrow();
    expect(() => validateCards(["As", "Ks"], ["Qh"])).toThrow();
  });
  it("splits a board-only royal flush including multiway shares", () => {
    expect(
      estimateEquity(
        ["2c", "3d"],
        ["As", "Ks", "Qs", "Js", "Ts"],
        "Balanced",
        1,
        30,
      ).equity,
    ).toBe(0.5);
    expect(
      estimateEquity(
        ["2c", "3d"],
        ["As", "Ks", "Qs", "Js", "Ts"],
        "Balanced",
        3,
        30,
      ).equity,
    ).toBe(0.25);
  });
  it("never invents river draw equity and handles the nuts", () => {
    expect(
      estimateEquity(
        ["As", "Ks"],
        ["Qs", "Js", "Ts", "2d", "3h"],
        "Balanced",
        1,
        30,
      ).equity,
    ).toBe(1);
    const read = estimateEquity(
      ["2s", "4s"],
      ["Ah", "Kd", "Qc", "9h", "7c"],
      "Tight",
      1,
      100,
    );
    expect(read.equity).toBeLessThan(0.1);
  });
  it("samples a user-selected range and rejects impossible multiway ranges", () => {
    const read = estimateEquity(["As", "Ah"], [], "Balanced", 1, 500, false, [
      "KK",
    ]);
    expect(read.equity).toBeGreaterThan(0.75);
    expect(read.equity).toBeLessThan(0.9);
    expect(() =>
      estimateEquity(["As", "Ah"], [], "Balanced", 3, 30, false, ["KK"]),
    ).toThrow();
  });
});

function fixture(): Table {
  const table = newHand(2, 100);
  table.board = ["2c", "3h", "7d", "8s", "9c"];
  table.seats[0].cards = ["As", "Ah"];
  table.seats[1].cards = ["Ks", "Kh"];
  table.seats[2].cards = ["Qs", "Qh"];
  return table;
}
describe("no-limit betting and settlement", () => {
  it("keeps the big blind option after limps", () => {
    let table = newHand(2, 100);
    expect(table.turn).toBe(0);
    table = act(table, "call");
    table = act(table, "call");
    expect(table.turn).toBe(2);
    expect(table.street).toBe(0);
    table = act(table, "check");
    expect(table.street).toBe(1);
    expect(table.turn).toBe(1);
  });
  it("uses heads-up action order and rotates the button", () => {
    let table = newHand(1, 100);
    expect(table.turn).toBe(0);
    table = act(table, "call");
    table = act(table, "check");
    expect(table.turn).toBe(1);
    expect(newHand(1, 100, 2, table).dealer).toBe(1);
  });
  it("does not mutate prior state or skip responses to a raise", () => {
    const before = newHand(2, 100);
    const next = act(before, "raise", 4);
    expect(before.seats[0].stack).toBe(100);
    expect(next.currentBet).toBe(4);
    expect(next.minRaise).toBe(3);
    expect(next.pending).toEqual([1, 2]);
    expect(() => act(next, "check")).toThrow();
    expect(() => act(next, "raise", 5)).toThrow();
    expect(() => act(next, "raise", NaN)).toThrow();
  });
  it("does not reopen a previous raiser after a single short all-in", () => {
    let table = newHand(2, 100);
    table = act(table, "raise", 4);
    table.seats[1].stack = 4.5;
    table = act(table, "raise", 5);
    table = act(table, "call");
    expect(table.turn).toBe(0);
    expect(canRaise(table, 0)).toBe(false);
    expect(amountToCall(table, 0)).toBe(1);
  });
  it("settles unequal all-ins with a main pot, side pot and uncalled refund", () => {
    const table = fixture();
    [20, 50, 80].forEach((contribution, id) => {
      table.seats[id].contribution = contribution;
      table.seats[id].stack = 0;
      table.seats[id].allIn = true;
    });
    table.pot = 150;
    const result = settle(table);
    expect(result.seats.map((seat) => seat.stack)).toEqual([60, 60, 30]);
    expect(result.result).toContain("Side pot");
    expect(result.result).toContain("uncalled");
    expect(runToHero(result).seats.map((seat) => seat.stack)).toEqual([
      60, 60, 30,
    ]);
  });
  it("prices short-stack calls against only contestable contribution layers", () => {
    const table = fixture();
    [10, 30, 40].forEach((amount, id) => {
      table.seats[id].contribution = amount;
      table.seats[id].bet = amount;
    });
    table.seats[0].stack = 10;
    table.currentBet = 40;
    table.pot = 80;
    expect(amountToCall(table, 0)).toBe(10);
    expect(eligiblePotForCall(table, 0)).toBe(50);
    expect(requiredEquity(eligiblePotForCall(table, 0), 10)).toBeCloseTo(1 / 6);
  });
  it("reopens betting after cumulative short all-ins reach a full raise", () => {
    let table = newHand(3, 100);
    table = act(table, "raise", 4);
    table = act(table, "call");
    table.seats[1].stack = 4.5;
    table = act(table, "raise", 5);
    table.seats[2].stack = 6;
    table = act(table, "raise", 7);
    expect(table.turn).toBe(3);
    expect(canRaise(table, 3)).toBe(true);
  });
  it("includes folded contributions but excludes folded winners", () => {
    const table = fixture();
    table.seats.forEach((seat) => {
      seat.contribution = 10;
      seat.stack = 0;
    });
    table.seats[0].folded = true;
    table.pot = 30;
    expect(settle(table).seats.map((seat) => seat.stack)).toEqual([0, 30, 0]);
  });
  it("distributes every odd chip on a split", () => {
    const table = fixture();
    table.board = ["As", "Ks", "Qs", "Js", "Ts"];
    table.seats[0].cards = ["2h", "3h"];
    table.seats[1].cards = ["4h", "5h"];
    table.seats.forEach((seat, id) => {
      seat.contribution = id === 2 ? 0.5 : 1;
      seat.stack = 0;
    });
    table.seats[2].folded = true;
    table.pot = 2.5;
    expect(settle(table).seats.map((seat) => seat.stack)).toEqual([1, 1.5, 0]);
  });
  it("has AI that raises using only its own cards and the visible board", () => {
    const table = newHand(1, 100, 1, undefined, "Aggressive regular");
    table.turn = 1;
    table.seats[1].cards = ["As", "Ah"];
    const first = aiDecision(table, () => 0);
    expect(first.action).toBe("raise");
    table.seats[0].cards = ["2c", "3d"];
    expect(aiDecision(table, () => 0)).toEqual(first);
  });
  it("finishes multiway sessions and conserves chips through folds, calls and all-ins", () => {
    for (const opponents of [1, 3, 5]) {
      const random = seededRandom(`game-${opponents}`);
      for (const policy of ["calls", "raises", "all-in", "mixed"]) {
        let table = runToHero(
          newHand(opponents, 20, 1, undefined, "Mixed table", random),
          random,
        );
        for (let decisions = 0; !table.over && decisions < 80; decisions++) {
          const choice = random();
          const raise =
            canRaise(table) &&
            (policy === "all-in" ||
              policy === "raises" ||
              (policy === "mixed" && choice > 0.7));
          table = runToHero(
            act(
              table,
              policy === "mixed" && choice < 0.15 && amountToCall(table)
                ? "fold"
                : raise
                  ? "raise"
                  : amountToCall(table)
                    ? "call"
                    : "check",
              policy === "all-in"
                ? table.seats[0].bet + table.seats[0].stack
                : minimumRaiseTo(table),
            ),
            random,
          );
          expect(
            table.seats.reduce((sum, seat) => sum + seat.stack, 0) + table.pot,
          ).toBe((opponents + 1) * 20);
        }
        expect(table.over).toBe(true);
        expect(table.seats.every((seat) => seat.stack >= 0)).toBe(true);
      }
    }
  }, 30000);
});
