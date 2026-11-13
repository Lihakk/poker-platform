import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import PageShell from "../components/PageShell";
import { theorySections } from "../data/pokerTheory";
import {
  callEV,
  betEV,
  bluffBreakEven,
  clamp,
  requiredEquity,
} from "../lib/pokerMath";

const modes = ["Call EV", "Bluff EV", "Draw odds", "Street sizing"];
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const ev = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)} bb`;

export default function PokerMath() {
  const [mode, setMode] = useState(modes[0]);
  const [pot, setPot] = useState(75);
  const [call, setCall] = useState(25);
  const [equity, setEquity] = useState(38);
  const [bet, setBet] = useState(50);
  const [folds, setFolds] = useState(42);
  const [outs, setOuts] = useState(9);
  const [draw, setDraw] = useState("Flop to river (both cards)");
  const [stack, setStack] = useState(100);
  const [streets, setStreets] = useState(3);
  const equityRate = equity / 100;
  const odds = requiredEquity(pot, call);
  const callValue = callEV(pot, call, equityRate);
  const bluffValue = betEV(pot, bet, bet, equityRate, folds / 100);
  const pureBluff = betEV(pot, bet, bet, 0, folds / 100);
  const unseen = draw === "Turn to river (one card)" ? 46 : 47;
  const count = draw === "Flop to river (both cards)" ? 2 : 1;
  const drawChance = (cleanOuts: number) =>
    1 -
    Array.from(
      { length: count },
      (_, index) => (unseen - cleanOuts - index) / (unseen - index),
    ).reduce((product, chance) => product * chance, 1);
  const g = (Math.pow(1 + (2 * stack) / Math.max(pot, 1), 1 / streets) - 1) / 2;
  const sizes = Array.from({ length: streets }, (_, index) => {
    const nextPot = pot * Math.pow(1 + 2 * g, index);
    const remaining = stack - (nextPot - pot) / 2;
    const size = Math.min(remaining, nextPot * g);
    const step = {
      index: index + 1,
      pot: nextPot,
      size,
      remaining: remaining - size,
    };
    return step;
  });

  return (
    <PageShell>
      <header className="training-header">
        <div>
          <p className="eyebrow">Study / Math workbench</p>
          <h1>
            Give your intuition
            <br />
            <em>some numbers.</em>
          </h1>
          <p>
            A decision is an estimate. Change the assumptions and watch where
            the answer moves.
          </p>
        </div>
        <Calculator size={38} className="workbench-icon" />
      </header>
      <div className="study-toolbar">
        <div
          role="tablist"
          aria-label="Calculator modes"
          className="segmented-tabs"
        >
          {modes.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={mode === item}
              className={mode === item ? "active" : ""}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <Link to="/equity-lab" className="text-link">
          Estimate hand equity
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="math-workbench" role="tabpanel" aria-label={mode}>
        <section className="math-inputs">
          <p className="eyebrow">Your assumptions</p>
          {mode !== "Draw odds" && (
            <Numeric
              label={
                mode === "Call EV"
                  ? "Current pot, including opponent bet"
                  : "Current pot"
              }
              value={pot}
              change={setPot}
              min={1}
              max={2000}
            />
          )}
          {mode === "Call EV" && (
            <>
              <Numeric
                label="Cost to call"
                value={call}
                change={setCall}
                min={0}
                max={1000}
              />
              <Slider
                label="Estimated showdown equity"
                value={equity}
                change={setEquity}
              />
              <label className="math-preset">
                Example
                <select
                  defaultValue=""
                  onChange={(event) => {
                    const values = JSON.parse(event.target.value);
                    setPot(values[0]);
                    setCall(values[1]);
                    setEquity(values[2]);
                  }}
                >
                  <option value="" disabled>
                    Choose a river example
                  </option>
                  <option value="[75,25,30]">Half-pot bet · 30% equity</option>
                  <option value="[200,100,25]">
                    Pot-size bet · 25% equity
                  </option>
                  <option value="[300,200,45]">
                    Double-pot bet · 45% equity
                  </option>
                </select>
              </label>
            </>
          )}
          {mode === "Bluff EV" && (
            <>
              <Numeric
                label="Bet size"
                value={bet}
                change={setBet}
                min={1}
                max={1000}
              />
              <Slider
                label="Estimated opponent folds"
                value={folds}
                change={setFolds}
              />
              <Slider
                label="Equity when called"
                value={equity}
                change={setEquity}
              />
            </>
          )}
          {mode === "Draw odds" && (
            <>
              <Numeric
                label="Clean outs"
                value={outs}
                change={setOuts}
                min={0}
                max={20}
                unit="cards"
              />
              <label className="math-preset">
                Cards you will see
                <select
                  value={draw}
                  onChange={(event) => setDraw(event.target.value)}
                >
                  {[
                    "Flop to turn (one card)",
                    "Flop to river (both cards)",
                    "Turn to river (one card)",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {mode === "Street sizing" && (
            <>
              <Numeric
                label="Effective remaining stack"
                value={stack}
                change={setStack}
                min={1}
                max={1000}
              />
              <label className="math-preset">
                Betting streets remaining
                <select
                  value={streets}
                  onChange={(event) => setStreets(Number(event.target.value))}
                >
                  {[1, 2, 3].map((value) => (
                    <option value={value} key={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </section>
        <section className="math-output" aria-live="polite">
          <p className="eyebrow">
            {mode === "Draw odds"
              ? "Card probability"
              : mode === "Street sizing"
                ? "A pot-building plan"
                : "Estimated result"}
          </p>
          {mode === "Call EV" && (
            <>
              <div className="math-big-result">
                <strong className={callValue >= 0 ? "positive" : "negative"}>
                  {ev(callValue)}
                </strong>
                <span>
                  {callValue >= 0 ? "Positive" : "Negative"} incremental call EV
                </span>
              </div>
              <div className="math-stat-row">
                <div>
                  <span>Break-even equity</span>
                  <strong>{percent(odds)}</strong>
                </div>
                <div>
                  <span>Final pot</span>
                  <strong>{pot + call} bb</strong>
                </div>
                <div>
                  <span>Equity margin</span>
                  <strong>{percent(equityRate - odds)}</strong>
                </div>
              </div>
              <div className="formula-read">
                <code>
                  {percent(equityRate)} × {pot + call} − {call} ={" "}
                  {ev(callValue)}
                </code>
                <p>
                  Your return includes your own call. Subtract the full call
                  cost once.
                </p>
              </div>
              <h3>How sensitive is the decision?</h3>
              <div className="sensitivity-bars">
                {Array.from({ length: 7 }, (_, index) =>
                  clamp(odds * 100 + (index - 3) * 5, 0, 100),
                ).map((value, index) => {
                  const result = callEV(pot, call, value / 100);
                  return (
                    <div key={index}>
                      <span>{value.toFixed(0)}% equity</span>
                      <div>
                        <i
                          className={result >= 0 ? "gain-bar" : "loss-bar"}
                          style={{
                            width: `${Math.min(100, (Math.abs(result) / Math.max(pot, call, 1)) * 200 + 2)}%`,
                          }}
                        />
                      </div>
                      <b>{ev(result)}</b>
                    </div>
                  );
                })}
              </div>
              <p className="math-assumption">
                Showdown model. No later bets, rake or tournament payout
                effects. Earlier streets can realize less than raw equity.
              </p>
            </>
          )}
          {mode === "Bluff EV" && (
            <>
              <div className="math-big-result">
                <strong className={bluffValue >= 0 ? "positive" : "negative"}>
                  {ev(bluffValue)}
                </strong>
                <span>Bet EV with your called-equity estimate</span>
              </div>
              <div className="math-stat-row">
                <div>
                  <span>Pure-bluff EV</span>
                  <strong>{ev(pureBluff)}</strong>
                </div>
                <div>
                  <span>Pure-bluff folds needed</span>
                  <strong>{percent(bluffBreakEven(pot, bet))}</strong>
                </div>
                <div>
                  <span>Pot when called</span>
                  <strong>{pot + bet * 2} bb</strong>
                </div>
              </div>
              <div className="formula-read">
                <code>F × pot + (1 − F) × (equity × final pot − bet)</code>
                <p>
                  Winning immediately and being called are different branches.
                  The opponent contributes {bet} bb when calling.
                </p>
              </div>
              <h3>Fold-rate sensitivity</h3>
              <div className="sensitivity-bars">
                {[10, 20, 30, 40, 50, 60, 70].map((value) => {
                  const result = betEV(pot, bet, bet, equityRate, value / 100);
                  return (
                    <div key={value}>
                      <span>{value}% folds</span>
                      <div>
                        <i
                          className={result >= 0 ? "gain-bar" : "loss-bar"}
                          style={{
                            width: `${Math.min(100, (Math.abs(result) / Math.max(pot, bet)) * 100 + 2)}%`,
                          }}
                        />
                      </div>
                      <b>{ev(result)}</b>
                    </div>
                  );
                })}
              </div>
              <p className="math-assumption">
                One matching caller and no re-raise or future bets. Equity
                should be against the calling range. A stronger continuation
                range can reduce a larger bet’s value.
              </p>
            </>
          )}
          {mode === "Draw odds" && (
            <>
              <div className="math-big-result">
                <strong>{percent(drawChance(outs))}</strong>
                <span>Chance to hit at least one of {outs} clean outs</span>
              </div>
              <div className="formula-read">
                <code>
                  {count === 2
                    ? `1 − (${unseen - outs}/${unseen}) × (${unseen - outs - 1}/${unseen - 1})`
                    : `${outs} / ${unseen}`}
                </code>
                <p>
                  {unseen} unseen cards · {count}{" "}
                  {count === 1 ? "card" : "cards"} to come
                </p>
              </div>
              <div className="draw-odds-table">
                <div>
                  <span>Draw</span>
                  <span>Outs</span>
                  <span>Hit probability</span>
                </div>
                {[
                  { title: "Gutshot", outs: 4 },
                  { title: "Open-ended straight", outs: 8 },
                  { title: "Flush draw", outs: 9 },
                  { title: "12 distinct clean outs", outs: 12 },
                  { title: "15 distinct clean outs", outs: 15 },
                ].map((row) => (
                  <div key={row.outs}>
                    <span>{row.title}</span>
                    <span>{row.outs}</span>
                    <strong>{percent(drawChance(row.outs))}</strong>
                  </div>
                ))}
              </div>
              <p className="math-assumption">
                This is improvement probability, not full showdown equity.
                Assumes all listed outs are clean and no known opponent cards.
                Two-card odds require seeing both remaining cards.
              </p>
            </>
          )}
          {mode === "Street sizing" && (
            <>
              <div className="math-big-result">
                <strong>{percent(g)}</strong>
                <span>Same fraction of pot on each street</span>
              </div>
              <div className="formula-read">
                <code>g = ((1 + 2 × stack / pot)^(1 / streets) − 1) / 2</code>
                <p>
                  Starting SPR {(stack / pot).toFixed(1)} · {streets}{" "}
                  {streets === 1 ? "street" : "streets"}
                </p>
              </div>
              <div className="draw-odds-table">
                <div>
                  <span>Street</span>
                  <span>Pot</span>
                  <span>Bet</span>
                </div>
                {sizes.map((step) => (
                  <div key={step.index}>
                    <span>Bet {step.index}</span>
                    <span>{step.pot.toFixed(1)} bb</span>
                    <strong>{step.size.toFixed(1)} bb</strong>
                  </div>
                ))}
              </div>
              <p className="math-assumption">
                Heads-up, one call on every street, no raises and no rake. This
                puts the entire effective stack in; it is a planning tool, not a
                recommendation to stack off.
              </p>
            </>
          )}
        </section>
      </div>
      <section className="math-concepts">
        <div className="section-title">
          <h2>The concepts behind the numbers</h2>
          <Link to="/strategy-library" className="text-link">
            Study the full lessons
            <ArrowRight size={16} />
          </Link>
        </div>
        {theorySections.map((section) => (
          <details key={section.title}>
            <summary>
              {section.title}
              <span>+</span>
            </summary>
            <div>
              <p>{section.summary}</p>
              {section.formula && <code>{section.formula}</code>}
              <p>{section.example}</p>
              <ul>
                {section.mistakes.map((mistake) => (
                  <li key={mistake}>{mistake}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </section>
    </PageShell>
  );
}
function Numeric({
  label,
  value,
  change,
  min,
  max,
  unit = "bb",
}: {
  label: string;
  value: number;
  change: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <label className="math-numeric">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) =>
            change(clamp(Number(event.target.value), min, max))
          }
        />
        <span>{unit}</span>
      </div>
    </label>
  );
}
function Slider({
  label,
  value,
  change,
}: {
  label: string;
  value: number;
  change: (value: number) => void;
}) {
  return (
    <label className="math-slider">
      <span>
        {label}
        <strong>{value}%</strong>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => change(Number(event.target.value))}
      />
      <small>
        <span>0%</span>
        <span>100%</span>
      </small>
    </label>
  );
}
