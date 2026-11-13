import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import PageShell from "../components/PageShell";
import PlayingCard from "../components/PlayingCard";
import api from "../lib/axios";
import { cardCodes } from "../lib/equity";
import { formatEv, formatPercent } from "../lib/format";
import { useAdvisor } from "../hooks/useAdvisor";
import { useProgress, useProgressStore } from "../store/useProgressStore";

interface ScenarioAction {
  id: number;
  action_type: string;
  raise_amount: number;
  is_optimal: boolean;
  coach_comment: string;
}
interface Scenario {
  id: number;
  title: string;
  hero_position: string;
  hole_cards: string;
  board_cards: string;
  pot_size: number;
  stack_size: number;
  facing_bet?: number;
  hero_street_bet?: number;
  street: string;
  difficulty: string;
  villain_profile: string;
  focus: string;
  narrative_setup: string;
  actions: ScenarioAction[];
}

export default function Situations() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [index, setIndex] = useState(0);
  const [street, setStreet] = useState("All streets");
  const [difficulty, setDifficulty] = useState("All levels");
  const [selected, setSelected] = useState<ScenarioAction | null>(null);
  const [saved, setSaved] = useState(false);
  const progress = useProgress();
  const complete = useProgressStore((state) => state.completeLesson);
  const record = useProgressStore((state) => state.recordConcept);
  const saveNote = useProgressStore((state) => state.saveNote);
  useEffect(() => {
    let stale = false;
    api
      .get("/scenarios")
      .then(({ data }) => {
        if (!stale) setScenarios(data);
      })
      .catch(() => {
        if (!stale)
          setError("Situations could not be loaded. Please try again.");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [retry]);
  const filtered = scenarios.filter(
    (scenario) =>
      (street === "All streets" || scenario.street === street) &&
      (difficulty === "All levels" || scenario.difficulty === difficulty),
  );
  const scenario = filtered[index];
  const solved = filtered.filter((item) =>
    progress.lessons.includes(`scenario:${item.id}`),
  ).length;
  const facing = scenario?.facing_bet;
  const committed = scenario?.hero_street_bet ?? 0;
  const { advisor, error: readError } = useAdvisor(
    scenario && selected
      ? {
          holeCards: scenario.hole_cards,
          boardCards: scenario.board_cards,
          potSize: scenario.pot_size,
          stackSize: scenario.stack_size,
          facingBet: facing ?? 0,
          opponentStyle: scenario.villain_profile,
          raiseSize: Math.min(
            scenario.stack_size,
            Math.max(
              0,
              (selected.action_type === "Raise"
                ? selected.raise_amount
                : (scenario.actions.find(
                    (action) => action.action_type === "Raise",
                  )?.raise_amount ?? 0)) - committed,
            ),
          ),
        }
      : null,
  );
  function move(next: number) {
    setIndex(next);
    setSelected(null);
    setSaved(false);
  }
  function answer(action: ScenarioAction) {
    if (selected || !scenario) return;
    setSelected(action);
    complete(`scenario:${scenario.id}`);
    record(scenario.focus || "Situations", action.is_optimal);
  }
  const label = (action: ScenarioAction) =>
    action.action_type === "Call" &&
    facing === 0 &&
    scenario?.street !== "Preflop"
      ? "Check"
      : action.action_type === "Raise"
        ? `${facing === 0 && scenario?.street !== "Preflop" ? "Bet" : "Raise to"} ${action.raise_amount} bb`
        : action.action_type === "Call" && facing
          ? `Call ${facing} bb`
          : action.action_type;

  return (
    <PageShell>
      <header className="training-header">
        <div>
          <p className="eyebrow">Practice / Situation room</p>
          <h1>
            One spot.
            <br />
            <em>A reasoned decision.</em>
          </h1>
          <p>
            Read the action and opponent tendency. Choose a line, then examine
            the coaching.
          </p>
        </div>
        <div className="study-progress">
          <CheckCircle2 size={24} />
          <strong>
            {solved}
            <small> / {filtered.length}</small>
          </strong>
          <span>situations reviewed</span>
        </div>
      </header>
      <div className="study-toolbar">
        <select
          aria-label="Street"
          value={street}
          onChange={(event) => {
            setStreet(event.target.value);
            move(0);
          }}
        >
          {[
            "All streets",
            ...new Set(scenarios.map((item) => item.street)),
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value);
            move(0);
          }}
        >
          {[
            "All levels",
            ...new Set(scenarios.map((item) => item.difficulty)),
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        {scenario && (
          <select
            aria-label="Choose situation"
            value={index}
            onChange={(event) => move(Number(event.target.value))}
          >
            {filtered.map((item, at) => (
              <option key={item.id} value={at}>
                {at + 1}. {item.title}
              </option>
            ))}
          </select>
        )}
      </div>
      {loading && (
        <div className="loading-state" role="status">
          Loading situations...
        </div>
      )}
      {error && (
        <div className="loading-state" role="alert">
          <p>{error}</p>
          <button
            className="quiet-button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry(retry + 1);
            }}
          >
            <RotateCcw size={17} />
            Try again
          </button>
        </div>
      )}
      {!loading && !error && !scenario && (
        <p className="empty-message">No situations match these filters.</p>
      )}
      {scenario && (
        <div className="situation-layout">
          <section className="situation-workspace">
            <div className="scenario-title">
              <p className="eyebrow">
                Spot {index + 1} / {filtered.length} · {scenario.street} ·{" "}
                {scenario.difficulty}
              </p>
              <h2>{scenario.title}</h2>
              <p>
                {scenario.focus} · {scenario.villain_profile}
              </p>
            </div>
            <div className="situation-felt">
              <div className="situation-pot">
                <span>{scenario.hero_position}</span>
                <strong>{scenario.pot_size} bb pot</strong>
                <span>{scenario.stack_size} bb stack</span>
              </div>
              <div className="community-cards">
                {cardCodes(scenario.board_cards).map((code) => (
                  <PlayingCard key={code} code={code} />
                ))}
                {Array.from(
                  { length: 5 - cardCodes(scenario.board_cards).length },
                  (_, i) => (
                    <div className="board-slot" key={i} />
                  ),
                )}
              </div>
              <div className="situation-hero">
                {cardCodes(scenario.hole_cards).map((code) => (
                  <PlayingCard key={code} code={code} />
                ))}
                <div>
                  <span>YOUR HAND</span>
                  <strong>
                    {facing !== undefined
                      ? facing
                        ? `${facing} bb to call`
                        : "No bet facing you"
                      : "Call price unspecified"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="situation-narrative">
              <p>{scenario.narrative_setup}</p>
            </div>
            <div className="situation-decisions">
              {scenario.actions
                .filter(
                  (action) =>
                    !(
                      facing === 0 &&
                      scenario.street !== "Preflop" &&
                      action.action_type === "Fold"
                    ),
                )
                .map((action) => (
                  <button
                    className={`quiz-option${selected?.id === action.id ? (action.is_optimal ? " correct" : " wrong") : ""}`}
                    disabled={
                      !!selected ||
                      (action.action_type === "Raise" &&
                        action.raise_amount > scenario.stack_size + committed)
                    }
                    key={action.id}
                    onClick={() => answer(action)}
                  >
                    {label(action)}
                  </button>
                ))}
            </div>
            {selected && (
              <div
                className={`quiz-feedback ${selected.is_optimal ? "is-correct" : ""}`}
                aria-live="polite"
              >
                <strong>
                  {selected.is_optimal
                    ? "Matches the lesson’s reference line."
                    : "Another line deserves a closer look."}
                </strong>
                <p>{selected.coach_comment}</p>
                <div className="result-actions">
                  <button
                    className="quiet-button"
                    disabled={saved}
                    onClick={() => {
                      saveNote(
                        scenario.title,
                        `${label(selected)}\n${scenario.narrative_setup}\n${selected.coach_comment}`,
                      );
                      setSaved(true);
                    }}
                  >
                    <BookmarkPlus size={16} />
                    {saved ? "Saved" : "Save decision"}
                  </button>
                  <button
                    className="quiet-button"
                    onClick={() => {
                      setSelected(null);
                      setSaved(false);
                    }}
                  >
                    <RotateCcw size={16} />
                    Replay spot
                  </button>
                </div>
              </div>
            )}
            <div className="question-footer">
              <button
                className="quiet-button"
                disabled={index === 0}
                onClick={() => move(index - 1)}
              >
                <ArrowLeft size={17} />
                Previous
              </button>
              <button
                className="button-primary"
                disabled={index + 1 >= filtered.length}
                onClick={() => move(index + 1)}
              >
                Next spot
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
          <aside className="situation-coach">
            <p className="eyebrow">A second perspective</p>
            <h2>Check the assumptions.</h2>
            {!selected ? (
              <p>
                Which worse hands call? Which better hands fold? What is the
                price, and does the opponent’s range support your line?
              </p>
            ) : advisor ? (
              <>
                <p>{advisor.handClass}</p>
                <div className="analysis-metrics">
                  <div>
                    <span>Sampled equity</span>
                    <strong>{formatPercent(advisor.equity)}</strong>
                  </div>
                  <div>
                    <span>Sampling margin</span>
                    <strong>±{formatPercent(advisor.error)}</strong>
                  </div>
                  {facing !== undefined && (
                    <>
                      <div>
                        <span>Call price</span>
                        <strong>{formatPercent(advisor.potOdds)}</strong>
                      </div>
                      <div>
                        <span>Call EV</span>
                        <strong>{formatEv(advisor.callEv)}</strong>
                      </div>
                    </>
                  )}
                </div>
                <p>
                  {facing === undefined
                    ? "Call price is missing from this scenario, so call EV is not shown."
                    : advisor.reasoning}
                </p>
                <p className="lab-assumption">
                  The authored reference line includes strategic context. The
                  sampled estimate uses a simplified profile range and
                  future-free EV; the two can disagree.
                </p>
              </>
            ) : (
              <p>{readError ?? "Sampling the range..."}</p>
            )}
          </aside>
        </div>
      )}
    </PageShell>
  );
}
