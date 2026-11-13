import { useState } from "react";
import {
  ArrowRight,
  BookmarkPlus,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import PageShell from "../components/PageShell";
import PlayingCard from "../components/PlayingCard";
import {
  DECK,
  RANKS,
  cardCodes,
  startingClass,
  validateCards,
  preflopWeight,
} from "../lib/equity";
import { calculateAdvisor } from "../lib/pokerWorker";
import type { AdvisorResult } from "../lib/pokerAdvisor";
import { formatEv } from "../lib/format";
import { useProgressStore } from "../store/useProgressStore";

const ranks = [...RANKS].reverse();
const classes = ranks.flatMap((a, row) =>
  ranks.map((b, col) =>
    row === col ? a + b : row < col ? a + b + "s" : b + a + "o",
  ),
);
const presets = [
  "All hands",
  "Pairs & strong aces",
  "Broad training range",
  "Suited hands",
];
function presetRange(name: string) {
  return classes.filter((hand) =>
    name === "All hands" || name === "Pairs & strong aces"
      ? name === "All hands" || hand.length === 2 || /^A[KQJ]/.test(hand)
      : name === "Suited hands"
        ? hand.endsWith("s")
        : preflopWeight([
            hand[0] + "s",
            hand[1] + (hand.endsWith("s") ? "s" : "h"),
          ]) >= 0.57,
  );
}
function unblockedCombos(range: string[], known: string[]) {
  const available = DECK.filter((card) => !known.includes(card));
  let count = 0;
  for (let a = 0; a < available.length; a++)
    for (let b = a + 1; b < available.length; b++)
      if (range.includes(startingClass([available[a], available[b]]))) count++;
  return count;
}

export default function EquityLab() {
  const [hole, setHole] = useState("AhKh");
  const [board, setBoard] = useState("Qh7h2c");
  const [range, setRange] = useState(() => presetRange("Broad training range"));
  const [preset, setPreset] = useState("Broad training range");
  const [opponents, setOpponents] = useState(1);
  const [pot, setPot] = useState(75);
  const [call, setCall] = useState(25);
  const [stack, setStack] = useState(100);
  const [trials, setTrials] = useState(1000);
  const [result, setResult] = useState<AdvisorResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [analyzed, setAnalyzed] = useState("");
  const saveNote = useProgressStore((state) => state.saveNote);
  const known = [...cardCodes(hole), ...cardCodes(board)];
  const combos = unblockedCombos(range, known);
  const current = JSON.stringify([
    hole,
    board,
    range,
    opponents,
    pot,
    call,
    stack,
    trials,
  ]);
  const changed = !!result && analyzed !== current;
  function toggle(hand: string) {
    setRange((previous) =>
      previous.includes(hand)
        ? previous.filter((item) => item !== hand)
        : [...previous, hand],
    );
    setPreset("Custom range");
  }
  async function analyze() {
    setError("");
    setSaved(false);
    try {
      const cards = cardCodes(hole);
      const community = cardCodes(board);
      if (
        cards.join("") !==
          hole
            .replace(/\s/g, "")
            .replace(
              /([2-9tjqka])([SHDC])/gi,
              (_, rank: string, suit: string) =>
                rank.toUpperCase() + suit.toLowerCase(),
            ) ||
        community.length * 2 !== board.replace(/\s/g, "").length
      )
        throw new Error("Card format: Ah Kh; suits s, h, d, c. Use T for ten.");
      validateCards(cards, community);
      if (!range.length)
        throw new Error("Select at least one opponent hand class.");
      if (call > stack)
        throw new Error(
          "Call cost cannot exceed the effective stack. Use the actual all-in price.",
        );
      setBusy(true);
      const read = await calculateAdvisor({
        holeCards: cards.join(""),
        boardCards: community.join(""),
        potSize: pot,
        stackSize: stack,
        facingBet: call,
        opponents,
        trials,
        customRange: range,
      });
      setResult(read);
      setAnalyzed(current);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Calculation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <header className="training-header">
        <div>
          <p className="eyebrow">Study / Equity laboratory</p>
          <h1>
            Cards meet <em>ranges.</em>
          </h1>
          <p>
            Set the known cards. Choose the hands your opponent can have. Test
            the showdown estimate.
          </p>
        </div>
        <FlaskConical size={38} className="workbench-icon" />
      </header>
      <div className="equity-lab-layout">
        <section className="equity-setup">
          <div className="lab-card-inputs">
            <label>
              YOUR TWO CARDS
              <input
                value={hole}
                onChange={(event) => setHole(event.target.value)}
                maxLength={8}
                spellCheck={false}
                placeholder="Ah Kh"
              />
            </label>
            <label>
              BOARD
              <input
                value={board}
                onChange={(event) => setBoard(event.target.value)}
                maxLength={15}
                spellCheck={false}
                placeholder="Qh 7h 2c"
              />
            </label>
          </div>
          <div className="lab-card-preview">
            {cardCodes(hole)
              .slice(0, 2)
              .map((code, i) => (
                <PlayingCard key={`hero-${i}`} code={code} small />
              ))}
            <span className="lab-card-divider" />
            {cardCodes(board)
              .slice(0, 5)
              .map((code, i) => (
                <PlayingCard key={`board-${i}`} code={code} small />
              ))}
          </div>
          <div className="range-heading">
            <div>
              <h2>Opponent range</h2>
              <p>
                {range.length} classes · {combos} unblocked combinations
              </p>
            </div>
            <select
              aria-label="Range example"
              value={preset}
              onChange={(event) => {
                setPreset(event.target.value);
                setRange(presetRange(event.target.value));
              }}
            >
              <option value="Custom range" disabled>
                Custom range
              </option>
              {presets.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div
            className="range-matrix"
            aria-label="Select opponent starting hands"
          >
            {classes.map((hand) => (
              <button
                key={hand}
                type="button"
                aria-label={`${hand} ${range.includes(hand) ? "included" : "excluded"}`}
                aria-pressed={range.includes(hand)}
                onClick={() => toggle(hand)}
                className={`${hand.length === 2 ? "range-pair" : hand.endsWith("s") ? "range-suited" : "range-offsuit"}${range.includes(hand) ? " included" : ""}`}
              >
                {hand}
              </button>
            ))}
          </div>
          <div className="range-legend">
            <span>
              <i className="range-pair included" />
              Pairs
            </span>
            <span>
              <i className="range-suited included" />
              Suited
            </span>
            <span>
              <i className="range-offsuit included" />
              Offsuit
            </span>
            <button
              className="icon-button"
              title="Clear range"
              aria-label="Clear range"
              onClick={() => {
                setRange([]);
                setPreset("Custom range");
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <p className="lab-assumption">
            Examples are training ranges, not solved preflop charts. Every
            selected, unblocked combination is weighted equally. For multiple
            opponents the same range is sampled without card overlap.
          </p>
        </section>
        <section className="equity-results">
          <div className="lab-number-grid">
            <label>
              Pot including bet
              <input
                type="number"
                min={1}
                max={2000}
                value={pot}
                onChange={(event) =>
                  setPot(Math.max(1, Number(event.target.value)))
                }
              />
            </label>
            <label>
              Call cost
              <input
                type="number"
                min={0}
                max={1000}
                value={call}
                onChange={(event) =>
                  setCall(Math.max(0, Number(event.target.value)))
                }
              />
            </label>
            <label>
              Effective stack
              <input
                type="number"
                min={1}
                max={2000}
                value={stack}
                onChange={(event) =>
                  setStack(Math.max(1, Number(event.target.value)))
                }
              />
            </label>
            <label>
              Opponents
              <select
                value={opponents}
                onChange={(event) => setOpponents(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count}>{count}</option>
                ))}
              </select>
            </label>
            <label>
              Sampled showdowns
              <select
                value={trials}
                onChange={(event) => setTrials(Number(event.target.value))}
              >
                {[300, 1000, 3000].map((count) => (
                  <option key={count}>{count}</option>
                ))}
              </select>
            </label>
          </div>
          <button disabled={busy} className="button-primary" onClick={analyze}>
            {busy
              ? "Sampling showdowns..."
              : result
                ? "Recalculate"
                : "Calculate equity"}
            <ArrowRight size={18} />
          </button>
          {error && (
            <p role="alert" className="training-error">
              {error}
            </p>
          )}
          {result && (
            <div className="equity-read" aria-live="polite">
              {changed && (
                <p className="outdated-read">
                  Inputs changed. Recalculate to update this result.
                </p>
              )}
              <p className="eyebrow">Sampled showdown equity</p>
              <strong className="equity-percentage">
                {(result.equity * 100).toFixed(1)}
                <small>%</small>
              </strong>
              <p className="sampling-margin">
                Approx. 95% sampling margin: ±{(result.error * 100).toFixed(1)}{" "}
                percentage points
              </p>
              <div className="equity-proportion">
                <span style={{ width: `${result.equity * 100}%` }} />
              </div>
              <div className="analysis-metrics">
                <div>
                  <span>Call needs</span>
                  <strong>{(result.potOdds * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span>Call EV</span>
                  <strong
                    className={result.callEv >= 0 ? "positive" : "negative"}
                  >
                    {formatEv(result.callEv)}
                  </strong>
                </div>
                <div>
                  <span>Current hand</span>
                  <strong>{result.handClass}</strong>
                </div>
                <div>
                  <span>Samples</span>
                  <strong>{result.trials.toLocaleString()}</strong>
                </div>
              </div>
              <p className="lab-assumption">
                Equity includes ties as split shares. Sampling margin describes
                simulation noise, not whether the selected range is realistic.
                Call EV excludes future betting, rake, and payout effects.
              </p>
              <button
                className="quiet-button"
                disabled={saved || changed}
                onClick={() => {
                  saveNote(
                    "Equity lab",
                    `${hole} on ${board || "preflop"} · ${(result.equity * 100).toFixed(1)}% equity · ${formatEv(result.callEv)} call EV\nOpponent classes: ${range.join(", ")}`,
                  );
                  setSaved(true);
                }}
              >
                <BookmarkPlus size={17} />
                {saved ? "Saved to notebook" : "Save calculation"}
              </button>
            </div>
          )}
          {!result && (
            <div className="equity-read-placeholder">
              <FlaskConical size={30} />
              <h2>Make the range explicit.</h2>
              <p>
                Your result will reflect the cards and combinations you choose,
                rather than a fixed hand-strength score.
              </p>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
