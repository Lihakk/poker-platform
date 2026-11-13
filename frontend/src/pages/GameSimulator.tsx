import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookmarkPlus,
  Eye,
  EyeOff,
  RotateCcw,
  Settings2,
  ChevronDown,
  ChevronUp,
  Spade,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import PlayingCard from "../components/PlayingCard";
import PokerTable from "../components/PokerTable";
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  act,
  amountToCall,
  canRaise,
  eligiblePotForCall,
  liveSeats,
  minimumRaiseTo,
  newHand,
  PROFILES,
  type Action,
  type Table,
} from "../lib/holdem";
import { playOpponents } from "../lib/pokerWorker";
import { useAdvisor } from "../hooks/useAdvisor";
import { formatEv, formatPercent } from "../lib/format";
import { useProgressStore } from "../store/useProgressStore";

interface Review {
  hand: number;
  change: number;
  result: string;
  log: string[];
}

export default function GameSimulator() {
  const location = useLocation();
  const config = location.state?.config;
  const bounded = (
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(max, Math.max(min, Math.round(value)))
      : fallback;
  const [players, setPlayers] = useState(() =>
    bounded(config?.players, 3, 1, 5),
  );
  const [hands, setHands] = useState(() => bounded(config?.hands, 10, 5, 50));
  const [stack, setStack] = useState(() =>
    bounded(config?.stack, 100, 20, 300),
  );
  const [profile, setProfile] = useState(() =>
    ["Mixed table", ...PROFILES].includes(config?.profile)
      ? config.profile
      : "Mixed table",
  );
  const [settings, setSettings] = useState(true);
  const [coachVisible, setCoachVisible] = useState(config?.coach !== false);
  const [table, setTable] = useState<Table | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [raiseTo, setRaiseTo] = useState(6);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [session, setSession] = useState({
    hands: 10,
    stack: 100,
    players: 3,
    profile: "Mixed table",
  });
  const [saved, setSaved] = useState(false);
  const saveNote = useProgressStore((state) => state.saveNote);
  const hero = table?.seats[0];
  const settledNet = reviews.reduce((sum, review) => sum + review.change, 0);
  const cost = table ? amountToCall(table, 0) : 0;
  const finished =
    !!table?.over &&
    (table.hand >= session.hands ||
      !hero?.stack ||
      table.seats.filter((seat) => seat.stack > 0).length <= 1);
  const minimum =
    table && hero ? Math.min(hero.stack + hero.bet, minimumRaiseTo(table)) : 4;
  const maximum = hero ? hero.stack + hero.bet : stack;
  const target = Math.min(maximum, Math.max(minimum, raiseTo));
  const { advisor, error: advisorError } = useAdvisor(
    table && hero && !table.over && hero.cards.length === 2
      ? {
          holeCards: hero.cards.join(""),
          boardCards: table.board.join(""),
          potSize: table.pot,
          callPotSize: eligiblePotForCall(table, 0),
          allowRaise: canRaise(table, 0),
          stackSize: hero.stack,
          facingBet: cost,
          opponents: Math.max(1, liveSeats(table).length - 1),
          opponentStyle: session.profile,
          raiseSize: target - hero.bet,
        }
      : null,
  );

  async function resolve(next: Table, initialStack: number) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await playOpponents(next);
      setTable(result);
      setRaiseTo(
        Math.min(
          result.seats[0].bet + result.seats[0].stack,
          minimumRaiseTo(result),
        ),
      );
      if (result.over)
        setReviews((previous) => [
          ...previous,
          {
            hand: result.hand,
            change: result.seats[0].stack - initialStack,
            result: result.result,
            log: result.log,
          },
        ]);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The hand could not continue.",
      );
    } finally {
      setBusy(false);
    }
  }
  function start() {
    setSession({ hands, stack, players, profile });
    setReviews([]);
    setSettings(false);
    const next = newHand(players, stack, 1, undefined, profile);
    setTable(next);
    void resolve(next, stack);
  }
  function action(choice: Action, amount?: number) {
    if (!table || busy || table.over || table.turn !== 0) return;
    const initialStack = reviews.length
      ? session.stack + reviews.reduce((sum, review) => sum + review.change, 0)
      : session.stack;
    try {
      const next = act(table, choice, amount);
      setTable(next);
      void resolve(next, initialStack);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Invalid action.");
    }
  }
  function nextHand() {
    if (!table || busy || finished || !table.over) return;
    const next = newHand(
      session.players,
      session.stack,
      table.hand + 1,
      table,
      session.profile,
    );
    setTable(next);
    void resolve(next, table.seats[0].stack);
  }
  const disabled = busy || !table || table.over || table.turn !== 0;
  const allowRaise = table && !table.over && canRaise(table, 0);

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="app-main training-main">
        <header className="training-header">
          <div>
            <p className="eyebrow">Practice / Full table</p>
            <h1>
              Play the whole <em>hand.</em>
            </h1>
            <p>From the blinds to showdown. A new decision on every street.</p>
          </div>
          <button
            className="quiet-button"
            onClick={() => setSettings(!settings)}
            aria-expanded={settings}
          >
            <Settings2 size={18} /> Table settings
          </button>
        </header>
        <Dialog open={settings} onOpenChange={setSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {table ? "Next session settings" : "Build your table"}
              </DialogTitle>
              <DialogDescription>
                No-limit Texas Hold’em · 0.5 / 1 bb blinds
              </DialogDescription>
            </DialogHeader>
            <section className="table-configuration">
              <label>
                AI opponents
                <select
                  aria-label="AI opponents"
                  value={players}
                  onChange={(event) => setPlayers(Number(event.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "opponent" : "opponents"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Session length
                <select
                  aria-label="Session length"
                  value={hands}
                  onChange={(event) => setHands(Number(event.target.value))}
                >
                  {[5, 10, 20, 50].map((count) => (
                    <option key={count} value={count}>
                      {count} hands
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Starting stack
                <input
                  aria-label="Starting stack"
                  type="number"
                  min={20}
                  max={300}
                  step={5}
                  value={stack}
                  onChange={(event) =>
                    setStack(
                      Math.min(300, Math.max(20, Number(event.target.value))),
                    )
                  }
                />
              </label>
              <label>
                Opponent style
                <select
                  aria-label="Opponent style"
                  value={profile}
                  onChange={(event) => setProfile(event.target.value)}
                >
                  {["Mixed table", ...PROFILES].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <Button
                className="button-primary"
                onClick={start}
                disabled={busy}
              >
                {table ? "Restart session" : "Take your seat"}
                <ArrowRight size={18} />
              </Button>
            </section>
          </DialogContent>
        </Dialog>
        {!table && (
          <div className="empty-table">
            <Spade size={44} />
            <h2>The table is ready.</h2>
            <p>Blinds 0.5 / 1 bb · No-limit Texas Hold’em</p>
            <div className="empty-table-cards">
              <PlayingCard code="As" />
              <PlayingCard code="Kh" />
            </div>
          </div>
        )}
        {table && hero && (
          <>
            <div className="session-strip">
              <span>
                HAND{" "}
                <strong>
                  {table.hand} / {session.hands}
                </strong>
              </span>
              <span>
                STACK <strong>{hero.stack} bb</strong>
              </span>
              <span>
                NET{" "}
                <strong className={settledNet >= 0 ? "positive" : "negative"}>
                  {formatEv(settledNet)}
                </strong>
              </span>
              <span>
                {busy
                  ? "Opponents thinking..."
                  : finished
                    ? "Session complete"
                    : table.over
                      ? "Hand complete"
                      : "Your decision"}
              </span>
            </div>
            <div className="full-table-layout">
              <section className="full-table-play">
                <PokerTable table={table} busy={busy} />
                {error && (
                  <p role="alert" className="training-error">
                    {error}
                  </p>
                )}
                {!table.over && (
                  <div className="table-controls">
                    <div className="bet-control">
                      <label htmlFor="raise-amount">
                        {table.currentBet ? "Raise to" : "Bet"}
                        <input
                          id="raise-amount"
                          type="number"
                          min={minimum}
                          max={maximum}
                          value={target}
                          step={0.5}
                          disabled={disabled || !allowRaise}
                          onChange={(event) =>
                            setRaiseTo(Number(event.target.value))
                          }
                        />
                        <span>bb</span>
                      </label>
                      <Slider
                        aria-label="Bet size"
                        min={minimum}
                        max={maximum}
                        value={[target]}
                        step={0.5}
                        disabled={disabled || !allowRaise}
                        onValueChange={([value]) => setRaiseTo(value)}
                      />
                      <div className="bet-presets">
                        {[0.33, 0.5, 0.75, 1].map((fraction) => (
                          <button
                            key={fraction}
                            disabled={disabled || !allowRaise}
                            onClick={() =>
                              setRaiseTo(
                                Math.max(
                                  minimum,
                                  table.currentBet +
                                    Math.round(table.pot * fraction),
                                ),
                              )
                            }
                          >
                            {Math.round(fraction * 100)}% pot
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="table-action-buttons">
                      <Button
                        variant="outline"
                        className="quiet-button fold-button"
                        disabled={disabled || cost === 0}
                        onClick={() => action("fold")}
                      >
                        Fold
                      </Button>
                      <Button
                        variant="outline"
                        className="quiet-button"
                        disabled={disabled}
                        onClick={() => action(cost ? "call" : "check")}
                      >
                        {cost ? `Call ${cost} bb` : "Check"}
                      </Button>
                      <Button
                        className="button-primary"
                        disabled={disabled || !allowRaise}
                        onClick={() => action("raise", target)}
                      >
                        {table.currentBet
                          ? `Raise to ${target}`
                          : `Bet ${target}`}
                      </Button>
                      <Button
                        variant="destructive"
                        className="allin-button"
                        disabled={
                          disabled ||
                          !hero.stack ||
                          (maximum > table.currentBet && !allowRaise)
                        }
                        onClick={() =>
                          action(
                            maximum > table.currentBet ? "raise" : "call",
                            maximum,
                          )
                        }
                      >
                        All-in
                      </Button>
                    </div>
                  </div>
                )}
                {table.over && (
                  <section className="hand-result" aria-live="polite">
                    <p className="eyebrow">
                      {finished ? "Session complete" : "Hand review"}
                    </p>
                    <h2>
                      {finished
                        ? `Finished ${reviews.length} hands`
                        : "The chips have settled."}
                    </h2>
                    <p>{table.result}</p>
                    <div className="result-actions">
                      <button
                        className="quiet-button"
                        disabled={saved}
                        onClick={() => {
                          saveNote(
                            `Simulator · hand ${table.hand}`,
                            table.result + "\n" + table.log.join("\n"),
                          );
                          setSaved(true);
                        }}
                      >
                        <BookmarkPlus size={18} />
                        {saved ? "Saved to notebook" : "Save hand"}
                      </button>
                      {finished ? (
                        <button className="button-primary" onClick={start}>
                          <RotateCcw size={18} />
                          Play again
                        </button>
                      ) : (
                        <button className="button-primary" onClick={nextHand}>
                          Next hand
                          <ArrowRight size={18} />
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </section>
              <aside className="table-analysis">
                <div className="analysis-heading">
                  <h2>At the table</h2>
                  <button
                    className="icon-button"
                    title={coachVisible ? "Hide coaching" : "Show coaching"}
                    aria-label={
                      coachVisible ? "Hide coaching" : "Show coaching"
                    }
                    onClick={() => setCoachVisible(!coachVisible)}
                  >
                    {coachVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {coachVisible && !table.over && (
                  <div className="coach-read">
                    <p className="eyebrow">Coach’s read</p>
                    {advisor ? (
                      <>
                        <h3>
                          {advisor.recommendation === "Call" && !cost
                            ? "Check"
                            : advisor.recommendation === "Raise" &&
                                !table.currentBet
                              ? "Bet"
                              : advisor.recommendation}
                        </h3>
                        <p>{advisor.handClass}</p>
                        <div className="analysis-metrics">
                          <div>
                            <span>Equity</span>
                            <strong>{formatPercent(advisor.equity)}</strong>
                          </div>
                          <div>
                            <span>Required</span>
                            <strong>{formatPercent(advisor.potOdds)}</strong>
                          </div>
                          <div>
                            <span>Call EV</span>
                            <strong>{formatEv(advisor.callEv)}</strong>
                          </div>
                          <div>
                            <span>Bet / raise EV</span>
                            <strong>
                              {allowRaise
                                ? formatEv(advisor.raiseEv)
                                : "Unavailable"}
                            </strong>
                          </div>
                        </div>
                        <details>
                          <summary>Calculation & assumptions</summary>
                          <p>{advisor.reasoning}</p>
                          <p>
                            {advisor.range}. Multiway raise EV uses an
                            illustrative one-caller model.
                          </p>
                        </details>
                      </>
                    ) : (
                      <p role="status">
                        {advisorError ?? "Sampling opponent ranges..."}
                      </p>
                    )}
                  </div>
                )}
                <div className="action-feed">
                  <p className="eyebrow">Action history</p>
                  <ol>
                    {table.log.map((entry, index) => (
                      <li key={`${table.hand}-${index}`}>
                        <span>
                          {String(table.log.length - index).padStart(2, "0")}
                        </span>
                        <p>{entry}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>
            </div>
            {reviews.length > 0 && (
              <section className="session-reviews">
                <div className="section-title">
                  <h2>Session notebook</h2>
                  <span>{reviews.length} completed hands</span>
                </div>
                {reviews.map((review) => (
                  <div className="review-row" key={review.hand}>
                    <button
                      onClick={() =>
                        setExpandedReview(
                          expandedReview === review.hand ? null : review.hand,
                        )
                      }
                      aria-expanded={expandedReview === review.hand}
                    >
                      <span>Hand {review.hand}</span>
                      <strong
                        className={review.change >= 0 ? "positive" : "negative"}
                      >
                        {formatEv(review.change)}
                      </strong>
                      {expandedReview === review.hand ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                    {expandedReview === review.hand && (
                      <div>
                        <p>{review.result}</p>
                        {review.log.map((entry, index) => (
                          <p key={index} className="review-log">
                            {entry}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
