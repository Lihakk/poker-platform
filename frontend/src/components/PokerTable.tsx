import type { CSSProperties } from "react";
import { Coins, Spade, Trophy, UserRound } from "lucide-react";
import PlayingCard from "./PlayingCard";
import { amountToCall, type Seat, type Table } from "../lib/holdem";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";

const streets = ["Preflop", "Flop", "Turn", "River", "Showdown"];
const locations = [
  [12, 55],
  [22, 16],
  [50, 9],
  [78, 16],
  [88, 55],
];

function ChipStack({ amount }: { amount: number }) {
  return (
    <span className="wager-chip">
      <Coins size={14} />
      {amount} <small>bb</small>
    </span>
  );
}

export default function PokerTable({
  table,
  busy,
}: {
  table: Table;
  busy: boolean;
}) {
  const hero = table.seats[0];
  function seatStatus(seat: Seat) {
    if (!seat.cards.length) return "Out of the session";
    if (seat.folded) return "Folded";
    if (seat.allIn && !table.over) return "All-in";
    return seat.lastAction;
  }
  return (
    <TooltipProvider delayDuration={250}>
      <section className="poker-arena" aria-label="Poker table">
        <div className="arena-topline">
          <span>
            <span className="table-live-dot" />
            {streets[table.street]}
          </span>
          <span>
            NO LIMIT HOLD’EM <b>0.5 / 1 bb</b>
          </span>
        </div>
        <div className="felt-rail">
          <div className="felt-surface">
            <span className="felt-wordmark">
              <Spade size={18} /> POKERLEARN
            </span>
          </div>
        </div>
        <div className="arena-opponents" aria-label="Opponents">
          {table.seats.slice(1).map((seat, index) => {
            const position =
              table.seats.length === 2 ? [50, 12] : locations[index];
            const active = !table.over && table.turn === seat.id;
            return (
              <article
                key={seat.id}
                style={
                  {
                    "--seat-x": `${position[0]}%`,
                    "--seat-y": `${position[1]}%`,
                  } as CSSProperties
                }
                className={`arena-seat${seat.folded ? " seat-folded" : ""}${active ? " seat-active" : ""}`}
                aria-label={`${seat.name}, ${seat.stack} big blinds, ${seatStatus(seat)}`}
              >
                <div className="arena-seat-identity">
                  <span className="arena-avatar">
                    <UserRound size={17} />
                  </span>
                  <div>
                    <strong>{seat.name}</strong>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="seat-profile" tabIndex={0}>
                          {seat.profile}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{seat.profile}</TooltipContent>
                    </Tooltip>
                  </div>
                  {table.dealer === seat.id && (
                    <span className="arena-dealer" title="Dealer button">
                      D
                    </span>
                  )}
                </div>
                <div className="arena-seat-hand">
                  {seat.cards.map((card, i) =>
                    table.over && !seat.folded ? (
                      <PlayingCard code={card} small key={card} />
                    ) : (
                      <span
                        className="arena-card-back"
                        aria-label="Hidden card"
                        key={i}
                      >
                        <Spade size={12} />
                      </span>
                    ),
                  )}
                  <strong className="arena-stack">
                    {seat.stack}
                    <small>bb</small>
                  </strong>
                </div>
                <p className={seat.allIn && !table.over ? "seat-all-in" : ""}>
                  {seatStatus(seat)}
                </p>
                {!table.over && seat.bet > 0 && (
                  <div className="arena-wager">
                    <ChipStack amount={seat.bet} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <div className="arena-board">
          <div className="arena-pot">
            <Coins size={19} />
            <span>{table.over ? "Pot awarded" : "Total pot"}</span>
            <strong>
              {table.pot}
              <small>bb</small>
            </strong>
          </div>
          <div
            className="community-cards"
            key={`${table.hand}-${table.street}`}
            aria-label="Community cards"
          >
            {table.board.map((code) => (
              <PlayingCard code={code} key={code} />
            ))}
            {Array.from({ length: 5 - table.board.length }, (_, index) => (
              <div className="board-slot" key={index}>
                <Spade size={18} />
              </div>
            ))}
          </div>
          <span className="arena-turn" role="status">
            {table.over ? (
              <>
                <Trophy size={13} /> Hand complete
              </>
            ) : busy ? (
              "Opponents thinking..."
            ) : hero.folded ? (
              "Watching the hand"
            ) : (
              "Your turn to act"
            )}
          </span>
        </div>
        <div
          className={`arena-hero${hero.folded ? " seat-folded" : ""}${table.turn === 0 && !table.over && !busy ? " hero-active" : ""}`}
        >
          {!table.over && hero.bet > 0 && (
            <div className="hero-wager">
              <ChipStack amount={hero.bet} />
            </div>
          )}
          <div className="arena-hero-cards">
            {hero.cards.map((card) => (
              <PlayingCard code={card} key={card} />
            ))}
          </div>
          <div className="arena-hero-details">
            <span>
              You{" "}
              {table.dealer === 0 && (
                <b className="arena-dealer" title="Dealer button">
                  D
                </b>
              )}
            </span>
            <strong>
              {hero.stack}
              <small>bb</small>
            </strong>
            <p>
              {hero.allIn && !table.over
                ? "All-in"
                : hero.folded
                  ? "Folded"
                  : table.over
                    ? hero.lastAction
                    : `${amountToCall(table, 0)} bb to call`}
            </p>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
