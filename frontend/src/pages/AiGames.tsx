import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import PlayingCard from "../components/PlayingCard";
import type { PlayerAction } from "../lib/pokerAdvisor";
import { formatEv, formatPercent } from "../lib/format";
import { useAdvisor } from "../hooks/useAdvisor";
import { betEV } from "../lib/pokerMath";

interface AiHand {
  id: number;
  title: string;
  heroHand: string;
  board: string;
  pot: number;
  stack: number;
  position: string;
  aiProfile: string;
  prompt: string;
  facingBet: number;
}

interface PlayedHand {
  id: number;
  title: string;
  action: string;
  correct: boolean;
}

const hands: AiHand[] = [
  {
    id: 1,
    title: "Loose blind defender",
    heroHand: "AdKd",
    board: "Kc8d4s",
    pot: 48,
    stack: 126,
    position: "BTN",
    aiProfile: "Loose-passive",
    prompt:
      "You opened Button and the Big Blind called. They check the dry flop.",
    facingBet: 0,
  },
  {
    id: 2,
    title: "Aggressive turn lead",
    heroHand: "JcJs",
    board: "Ts8s3dQh",
    pot: 82,
    stack: 94,
    position: "CO",
    aiProfile: "Aggressive regular",
    prompt:
      "You c-bet the flop. The AI leads the turn for 36 bb; the current pot includes that bet.",
    facingBet: 36,
  },
  {
    id: 3,
    title: "Missed draw river",
    heroHand: "9s8s",
    board: "As7s2c4dKd",
    pot: 66,
    stack: 112,
    position: "BB",
    aiProfile: "Tight caller",
    prompt:
      "You defended preflop and missed the flush. The AI makes a small river bet after checking turn.",
    facingBet: 24,
  },
  {
    id: 4,
    title: "Thin value after missed draw",
    heroHand: "KcQh",
    board: "Qs9d4c2s6h",
    pot: 84,
    stack: 130,
    position: "BTN",
    aiProfile: "Sticky bluff-catcher",
    prompt:
      "You bet flop, checked turn, and the Big Blind checks a blank river.",
    facingBet: 0,
  },
  {
    id: 5,
    title: "Short stack reshove node",
    heroHand: "7h7d",
    board: "",
    pot: 7,
    stack: 18,
    position: "CO",
    aiProfile: "Loose opener",
    prompt:
      "Hijack opens in an ante tournament. You have a medium pair and a shallow stack behind.",
    facingBet: 5,
  },
  {
    id: 6,
    title: "Wet flop overpair",
    heroHand: "AsAd",
    board: "JsTs8d",
    pot: 54,
    stack: 122,
    position: "UTG",
    aiProfile: "Combo-draw heavy",
    prompt:
      "Button calls your UTG open and the flop is coordinated with two spades.",
    facingBet: 0,
  },
  {
    id: 7,
    title: "Ace-high river bluff catch",
    heroHand: "AhJh",
    board: "Kd7c3s3h2d",
    pot: 58,
    stack: 88,
    position: "BB",
    aiProfile: "Missed c-bettor",
    prompt:
      "Button c-bet flop, checked turn, then bets small on a blank river.",
    facingBet: 18,
  },
  {
    id: 8,
    title: "Small blind squeeze",
    heroHand: "AcKd",
    board: "",
    pot: 9,
    stack: 96,
    position: "SB",
    aiProfile: "Loose opener",
    prompt:
      "Cutoff opens, Button calls, and the Big Blind is tight behind you.",
    facingBet: 3,
  },
];

const profileOptions = [
  "Use hand profile",
  "Loose-passive",
  "Balanced regular",
  "Aggressive regular",
  "Tight caller",
];
const splitCards = (cards: string) => cards.match(/.{1,2}/g) ?? [];
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const minRaiseFor = (hand: AiHand) =>
  Math.min(hand.stack, Math.max(1, hand.facingBet * 2));
const defaultRaiseFor = (hand: AiHand) =>
  clamp(Math.round(hand.pot * 0.72), minRaiseFor(hand), hand.stack);
const streetFor = (board: string) =>
  ({ 0: "Preflop", 3: "Flop", 4: "Turn", 5: "River" })[
    splitCards(board).length
  ] ?? "Hand";

function opponentResponse(
  profile: string,
  action: PlayerAction,
  foldEquity: number,
  raiseAmount: number,
  pot: number,
  facingBet: number,
) {
  const style = profile.toLowerCase();
  if (action === "Fold") return "Takes the pot";
  if (action === "Call")
    return facingBet === 0
      ? "Keeps its range intact"
      : "Continues to the next node";
  if (style.includes("tight") && foldEquity > 0.36) return "Folds";
  if (
    style.includes("aggressive") &&
    raiseAmount < pot * 0.8 &&
    foldEquity < 0.4
  )
    return "Re-raises";
  if (foldEquity > 0.54 || (style.includes("tight") && raiseAmount > pot))
    return "Folds";
  return "Calls";
}

export default function AiGames() {
  const [handIndex, setHandIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<PlayerAction | null>(
    null,
  );
  const [score, setScore] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [profileOverride, setProfileOverride] = useState(profileOptions[0]);
  const [raiseAmount, setRaiseAmount] = useState(defaultRaiseFor(hands[0]));
  const [history, setHistory] = useState<PlayedHand[]>([]);

  const hand = hands[handIndex];
  const activeProfile =
    profileOverride === profileOptions[0] ? hand.aiProfile : profileOverride;
  const { advisor, error } = useAdvisor({
    holeCards: hand.heroHand,
    boardCards: hand.board,
    potSize: hand.pot,
    stackSize: hand.stack,
    position: hand.position,
    opponentStyle: activeProfile,
    facingBet: hand.facingBet,
  });

  const model = useMemo(() => {
    if (!advisor) return null;
    const baseSize = clamp(hand.pot * 0.72, hand.facingBet * 2.4, hand.stack);
    const sizePressure =
      Math.log2(
        (raiseAmount + hand.pot * 0.25) / (baseSize + hand.pot * 0.25),
      ) * 0.1;
    const foldEquity = clamp(advisor.foldEquity + sizePressure, 0.08, 0.8);
    const raiseEv = betEV(
      hand.pot,
      raiseAmount,
      Math.max(0, raiseAmount - hand.facingBet),
      advisor.equity,
      foldEquity,
    );
    const callEv = advisor.callEv;
    const recommendation: PlayerAction =
      raiseEv >= Math.max(0, callEv) ? "Raise" : callEv >= 0 ? "Call" : "Fold";
    return { foldEquity, raiseEv, callEv, recommendation };
  }, [advisor, hand.facingBet, hand.pot, hand.stack, raiseAmount]);

  if (!advisor || !model)
    return (
      <div className="app-frame">
        <Sidebar />
        <main className="app-main training-main">
          <div className="loading-state" role="status">
            <h1>Decision lab</h1>
            <p>{error ?? "Sampling opponent ranges..."}</p>
          </div>
        </main>
      </div>
    );

  const estimatedEv = (action: PlayerAction) =>
    action === "Fold" ? 0 : action === "Call" ? model.callEv : model.raiseEv;
  const bestEv = Math.max(0, model.callEv, model.raiseEv);
  const closeEnough = (action: PlayerAction) =>
    bestEv - estimatedEv(action) <= Math.max(1, hand.pot * 0.02);
  const isAligned = selectedAction ? closeEnough(selectedAction) : false;
  const aiResponse = selectedAction
    ? opponentResponse(
        activeProfile,
        selectedAction,
        model.foldEquity,
        raiseAmount,
        hand.pot,
        hand.facingBet,
      )
    : null;
  const minRaise = minRaiseFor(hand);
  const board = splitCards(hand.board);
  const displayAction = (action: PlayerAction) =>
    action === "Call" && hand.facingBet === 0
      ? "Check"
      : action === "Raise" && hand.facingBet === 0
        ? "Bet"
        : action;

  const chooseAction = (action: PlayerAction) => {
    if (selectedAction) return;
    const correct = closeEnough(action);
    setSelectedAction(action);
    setHandsPlayed((count) => count + 1);
    if (correct) setScore((count) => count + 1);
    setHistory((previous) =>
      [
        {
          id: hand.id,
          title: hand.title,
          action:
            action === "Raise"
              ? `${displayAction(action)} ${raiseAmount}`
              : displayAction(action),
          correct,
        },
        ...previous,
      ].slice(0, 5),
    );
  };

  const loadHand = (index: number) => {
    setHandIndex(index);
    setRaiseAmount(defaultRaiseFor(hands[index]));
    setSelectedAction(null);
  };

  const actionValue = (action: PlayerAction) =>
    action === "Fold" ? "0.0 bb" : formatEv(estimatedEv(action));

  return (
    <div className="ai-game-page flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="w-full p-4 pt-24 md:ml-64 md:p-10">
        <header className="ai-page-header">
          <div>
            <p className="eyebrow">Decision lab / AI practice</p>
            <h1>
              Read the spot. <em>Choose your line.</em>
            </h1>
            <p>
              Play compact hands against opponent profiles with sampled showdown
              equity. Make the decision first, then compare it with estimated
              values and coaching.
            </p>
          </div>
          <div className="ai-session-stat">
            <span>SESSION SCORE</span>
            <strong>
              {score}
              <small> / {handsPlayed}</small>
            </strong>
            <span>
              {handsPlayed === 0
                ? "No hands played"
                : `${Math.round((score / handsPlayed) * 100)}% aligned with model`}
            </span>
          </div>
        </header>

        <div className="ai-layout">
          <section className="ai-workspace" aria-labelledby="ai-hand-title">
            <div className="ai-hand-header">
              <div>
                <p className="eyebrow">
                  Hand {String(handIndex + 1).padStart(2, "0")} /{" "}
                  {String(hands.length).padStart(2, "0")} ·{" "}
                  {streetFor(hand.board)}
                </p>
                <h2 id="ai-hand-title">{hand.title}</h2>
              </div>
              <div className="ai-hand-meta">
                <span>{hand.position} POSITION</span>
                <span>{hand.pot} BB POT</span>
                <span>{hand.stack} BB STACK</span>
              </div>
            </div>

            <div className="ai-table" aria-label="Poker table" key={hand.id}>
              <div className="ai-opponent">
                <div className="ai-opponent-avatar">AI</div>
                <div>
                  <strong>Opponent</strong>
                  <span>{activeProfile}</span>
                </div>
                <div className="ai-card-back" aria-hidden="true">
                  ♠
                </div>
                <div className="ai-card-back" aria-hidden="true">
                  ♠
                </div>
              </div>
              <div className="ai-table-center">
                <span>BOARD</span>
                <div>
                  {board.map((card) => (
                    <PlayingCard code={card} small key={card} />
                  ))}
                  {Array.from({ length: 5 - board.length }, (_, index) => (
                    <div
                      className="ai-card-placeholder"
                      aria-hidden="true"
                      key={index}
                    />
                  ))}
                </div>
                <strong>
                  {hand.pot} <small>BB IN POT</small>
                </strong>
              </div>
              <div className="ai-hero">
                <div>
                  <span>YOUR HAND</span>
                  <strong>
                    {hand.position} · {hand.stack} BB
                  </strong>
                </div>
                <div>
                  {splitCards(hand.heroHand).map((card) => (
                    <PlayingCard code={card} key={card} />
                  ))}
                </div>
              </div>
            </div>

            <div className="ai-decision">
              <div className="ai-prompt">
                <span>THE SITUATION</span>
                <p>{hand.prompt}</p>
                {hand.facingBet > 0 && (
                  <strong>You face a {hand.facingBet} bb bet.</strong>
                )}
              </div>
              <label className="ai-profile-label">
                OPPONENT PROFILE
                <select
                  value={profileOverride}
                  onChange={(event) => setProfileOverride(event.target.value)}
                  disabled={selectedAction !== null}
                >
                  {profileOptions.map((profile) => (
                    <option key={profile}>{profile}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="ai-raise-control">
              <div>
                <label htmlFor="ai-raise-size">
                  {hand.facingBet ? "Raise to" : "Bet"}{" "}
                  <strong>{raiseAmount} bb</strong>
                </label>
                <span>
                  {Math.round((raiseAmount / hand.pot) * 100)}% of pot
                </span>
              </div>
              <input
                id="ai-raise-size"
                type="range"
                min={minRaise}
                max={hand.stack}
                value={raiseAmount}
                disabled={selectedAction !== null}
                onChange={(event) => setRaiseAmount(Number(event.target.value))}
              />
              <div>
                <span>{minRaise} bb minimum</span>
                <span>{hand.stack} bb all-in</span>
              </div>
            </div>

            <div className="ai-action-row" aria-label="Choose an action">
              {(["Fold", "Call", "Raise"] as PlayerAction[]).map((action) => (
                <button
                  type="button"
                  key={action}
                  disabled={selectedAction !== null}
                  onClick={() => chooseAction(action)}
                  className={`ai-action${selectedAction === action ? " ai-action-selected" : ""}`}
                >
                  <span>{displayAction(action)}</span>
                  <small>
                    {action === "Fold"
                      ? "Let it go"
                      : action === "Call"
                        ? hand.facingBet > 0
                          ? `Match ${hand.facingBet} bb`
                          : "See a free card"
                        : `${hand.facingBet ? "To" : "For"} ${raiseAmount} bb`}
                  </small>
                </button>
              ))}
            </div>

            {selectedAction && (
              <div
                className={`ai-result${isAligned ? " ai-result-positive" : ""}`}
                role="status"
              >
                <div>
                  <span>
                    {selectedAction === model.recommendation
                      ? "BEST ESTIMATED LINE"
                      : isAligned
                        ? "CLOSE DECISION"
                        : "ANOTHER LINE RATES HIGHER"}
                  </span>
                  <strong>
                    {displayAction(selectedAction)} ·{" "}
                    {actionValue(selectedAction)}
                  </strong>
                </div>
                <p>
                  The opponent {aiResponse?.toLowerCase()}. At this sizing the
                  model favors{" "}
                  {displayAction(model.recommendation).toLowerCase()}: fold{" "}
                  {actionValue("Fold")}, {hand.facingBet ? "call" : "check"}{" "}
                  {actionValue("Call")}, {hand.facingBet ? "raise" : "bet"}{" "}
                  {actionValue("Raise")}. These are approximate training
                  estimates, not solved ranges.
                </p>
              </div>
            )}

            <div className="ai-workspace-footer">
              <button
                type="button"
                onClick={() => loadHand((handIndex + 1) % hands.length)}
                disabled={!selectedAction}
                className="ai-next-button"
              >
                Next hand <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="ai-random-button"
                onClick={() => {
                  const next = Math.floor(Math.random() * (hands.length - 1));
                  loadHand(next >= handIndex ? next + 1 : next);
                }}
              >
                Random spot <span aria-hidden="true">↗</span>
              </button>
              <label className="ai-hand-picker">
                CHOOSE SPOT
                <select
                  value={handIndex}
                  onChange={(event) => loadHand(Number(event.target.value))}
                >
                  {hands.map((spot, index) => (
                    <option value={index} key={spot.id}>
                      {index + 1}. {spot.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <aside className="ai-insights">
            <div className="ai-insight-heading">
              <p className="eyebrow">Decision analysis</p>
              <h2>Behind the play</h2>
            </div>
            <div className="ai-value-grid">
              <div>
                <span>EQUITY</span>
                <strong>{formatPercent(advisor.equity)}</strong>
              </div>
              <div>
                <span>POT ODDS</span>
                <strong>{formatPercent(advisor.potOdds)}</strong>
              </div>
              <div>
                <span>FOLD EQUITY</span>
                <strong>{formatPercent(model.foldEquity)}</strong>
              </div>
              <div>
                <span>STACK / POT</span>
                <strong>{advisor.spr.toFixed(1)}</strong>
              </div>
            </div>
            <div className="ai-model-read">
              <span>{selectedAction ? "MODEL PREFERENCE" : "HAND READ"}</span>
              <strong>
                {selectedAction
                  ? displayAction(model.recommendation)
                  : advisor.handClass}
              </strong>
              <p>
                {selectedAction
                  ? `${advisor.handClass} on a ${advisor.texture} board. ${hand.facingBet ? "Raise" : "Bet"} EV changes with the size you choose.`
                  : "Choose an action to reveal the model preference and compare the estimated lines."}
              </p>
            </div>
            <div className="ai-ev-list">
              <div>
                <span>Fold EV</span>
                <strong>0.0 bb</strong>
              </div>
              <div>
                <span>{hand.facingBet ? "Call" : "Check"} EV</span>
                <strong>{selectedAction ? formatEv(model.callEv) : "—"}</strong>
              </div>
              <div>
                <span>{hand.facingBet ? "Raise" : "Bet"} EV</span>
                <strong>
                  {selectedAction ? formatEv(model.raiseEv) : "—"}
                </strong>
              </div>
            </div>
            <div className="ai-review-note">
              <span>COACH NOTE</span>
              <p>
                {selectedAction
                  ? `This read uses estimated equity ${formatPercent(advisor.equity)}, pot odds ${formatPercent(advisor.potOdds)}, fold equity ${formatPercent(model.foldEquity)}, and stack-to-pot ratio ${advisor.spr.toFixed(1)}. Compare the values above before replaying.`
                  : "Consider position, the price to continue, and how often this opponent folds before you act."}
              </p>
            </div>
            {history.length > 0 && (
              <div className="ai-history">
                <span>RECENT HANDS</span>
                {history.map((entry, index) => (
                  <div key={`${entry.id}-${index}`}>
                    <span>{entry.title}</span>
                    <strong
                      className={entry.correct ? "ai-history-positive" : ""}
                    >
                      {entry.action}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
