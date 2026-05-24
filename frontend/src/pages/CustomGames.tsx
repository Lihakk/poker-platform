import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { buildCustomGameRecommendation, formatEv, formatPercent } from '../lib/pokerAdvisor';

interface PracticeGame {
  id: number;
  name: string;
  format: string;
  seats: number;
  stackDepth: number;
  blindLevel: string;
  focus: string;
  difficulty: string;
  opponentStyle: string;
  anteLevel: string;
  tablePressure: string;
}

const formats = ['Cash Game', 'Tournament', 'Heads-Up', 'Final Table'];
const blindLevels = ['1 / 2', '2 / 5', '5 / 10', '25 / 50'];
const focuses = ['Preflop ranges', 'Continuation betting', 'Turn pressure', 'River bluffing', 'Bluff catching', 'Thin value'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const opponentStyles = ['Loose-passive', 'Balanced regular', 'Aggressive regular', 'Tight caller'];
const anteLevels = ['No ante', 'Big blind ante', 'Table antes'];
const tablePressures = ['Normal table', 'Bubble pressure', 'Final table', 'Deep cash'];

export default function CustomGames() {
  const [name, setName] = useState('Button steal practice');
  const [format, setFormat] = useState(formats[0]);
  const [seats, setSeats] = useState(6);
  const [stackDepth, setStackDepth] = useState(100);
  const [blindLevel, setBlindLevel] = useState(blindLevels[0]);
  const [focus, setFocus] = useState(focuses[0]);
  const [difficulty, setDifficulty] = useState(difficulties[1]);
  const [opponentStyle, setOpponentStyle] = useState(opponentStyles[1]);
  const [anteLevel, setAnteLevel] = useState(anteLevels[0]);
  const [tablePressure, setTablePressure] = useState(tablePressures[0]);
  const [games, setGames] = useState<PracticeGame[]>([
    {
      id: 1,
      name: 'Short stack tournament push-fold',
      format: 'Tournament',
      seats: 9,
      stackDepth: 18,
      blindLevel: '25 / 50',
      focus: 'Preflop ranges',
      difficulty: 'Intermediate',
      opponentStyle: 'Aggressive regular',
      anteLevel: 'Big blind ante',
      tablePressure: 'Bubble pressure',
    },
    {
      id: 2,
      name: 'Deep cash river decisions',
      format: 'Cash Game',
      seats: 6,
      stackDepth: 180,
      blindLevel: '2 / 5',
      focus: 'River bluffing',
      difficulty: 'Advanced',
      opponentStyle: 'Tight caller',
      anteLevel: 'No ante',
      tablePressure: 'Deep cash',
    },
  ]);

  const trainingProfile = useMemo(() => {
    const pressure = stackDepth <= 30 ? 'high preflop pressure' : stackDepth >= 150 ? 'deep postflop play' : 'balanced street-by-street play';
    return `${format}, ${seats}-max, ${stackDepth} bb stacks, ${pressure}`;
  }, [format, seats, stackDepth]);

  const currentRecommendation = useMemo(
    () => buildCustomGameRecommendation({ format, seats, stackDepth, blindLevel, focus, difficulty, opponentStyle, anteLevel, tablePressure }),
    [anteLevel, blindLevel, difficulty, focus, format, opponentStyle, seats, stackDepth, tablePressure],
  );

  const addGame = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const nextGame: PracticeGame = {
      id: Date.now(),
      name: trimmedName,
      format,
      seats,
      stackDepth,
      blindLevel,
      focus,
      difficulty,
      opponentStyle,
      anteLevel,
      tablePressure,
    };

    setGames((currentGames) => [nextGame, ...currentGames]);
  };

  const removeGame = (id: number) => {
    setGames((currentGames) => currentGames.filter((game) => game.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">Custom Games</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Build Practice Tables</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Configure repeatable drills for the exact stack depth, table size, and concept you want to sharpen.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <label className="text-sm font-bold text-slate-300" htmlFor="game-name">
              Game name
            </label>
            <input
              id="game-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-300">Format</p>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFormat(item)}
                    className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${
                      format === item ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-300">
                Seats
                <input
                  type="number"
                  min={2}
                  max={9}
                  value={seats}
                  onChange={(event) => setSeats(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
              <label className="text-sm font-bold text-slate-300">
                Stack bb
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={stackDepth}
                  onChange={(event) => setStackDepth(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <label className="mt-6 block text-sm font-bold text-slate-300">
              Blind level
              <select
                value={blindLevel}
                onChange={(event) => setBlindLevel(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                {blindLevels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="mt-6 block text-sm font-bold text-slate-300">
              Training focus
              <select
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                {focuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="mt-6 block text-sm font-bold text-slate-300">
              Opponent profile
              <select
                value={opponentStyle}
                onChange={(event) => setOpponentStyle(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                {opponentStyles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-300">
                Ante setup
                <select
                  value={anteLevel}
                  onChange={(event) => setAnteLevel(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {anteLevels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-slate-300">
                Pressure
                <select
                  value={tablePressure}
                  onChange={(event) => setTablePressure(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {tablePressures.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-300">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((item) => (
                  <button
                    key={item}
                    onClick={() => setDifficulty(item)}
                    className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${
                      difficulty === item ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={addGame} className="mt-6 w-full rounded-lg bg-cyan-600 px-5 py-4 font-black text-white transition hover:bg-cyan-500">
              Save Practice Game
            </button>
          </section>

          <section>
            <div className="mb-5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-200">Current setup</p>
              <p className="mt-2 text-xl font-black">{trainingProfile}</p>
              <p className="mt-2 text-slate-300">
                Drill focus: {focus}. Difficulty: {difficulty}. Blinds: {blindLevel}.
              </p>
            </div>

            <div className="mb-5 rounded-lg border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Recommendation model</p>
                  <h2 className="mt-2 text-2xl font-black text-cyan-200">{currentRecommendation.recommendation}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{currentRecommendation.summary}</p>
                </div>
                <div className="rounded-md bg-slate-950 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Confidence</p>
                  <p className="text-xl font-black">{formatPercent(currentRecommendation.confidence)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                <div className="rounded-md bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Equity</p>
                  <p className="font-black">{formatPercent(currentRecommendation.equity)}</p>
                </div>
                <div className="rounded-md bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Fold equity</p>
                  <p className="font-black">{formatPercent(currentRecommendation.foldEquity)}</p>
                </div>
                <div className="rounded-md bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Call EV</p>
                  <p className="font-black">{formatEv(currentRecommendation.callEv)}</p>
                </div>
                <div className="rounded-md bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Raise EV</p>
                  <p className="font-black">{formatEv(currentRecommendation.raiseEv)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {currentRecommendation.drills.map((drill) => (
                  <p key={drill} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                    {drill}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {games.map((game) => (
                <PracticeGameCard key={game.id} game={game} onRemove={removeGame} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function PracticeGameCard({ game, onRemove }: { game: PracticeGame; onRemove: (id: number) => void }) {
  const recommendation = buildCustomGameRecommendation({
    format: game.format,
    seats: game.seats,
    stackDepth: game.stackDepth,
    blindLevel: game.blindLevel,
    focus: game.focus,
    difficulty: game.difficulty,
    opponentStyle: game.opponentStyle,
    anteLevel: game.anteLevel,
    tablePressure: game.tablePressure,
  });

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{game.format}</p>
          <h2 className="mt-1 text-xl font-black">{game.name}</h2>
        </div>
        <button onClick={() => onRemove(game.id)} className="rounded-md bg-slate-800 px-3 py-2 text-sm font-bold text-rose-300 hover:bg-rose-950">
          Delete
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md bg-slate-950 px-3 py-3">
          <p className="text-slate-500">Seats</p>
          <p className="font-black">{game.seats}</p>
        </div>
        <div className="rounded-md bg-slate-950 px-3 py-3">
          <p className="text-slate-500">Stack</p>
          <p className="font-black">{game.stackDepth} bb</p>
        </div>
        <div className="rounded-md bg-slate-950 px-3 py-3">
          <p className="text-slate-500">Blinds</p>
          <p className="font-black">{game.blindLevel}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-cyan-500/20 bg-cyan-500/10 p-3">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Calculated line</p>
        <p className="mt-1 text-lg font-black">{recommendation.recommendation}</p>
      <p className="mt-1 text-xs text-slate-300">
        Equity {formatPercent(recommendation.equity)} - Fold equity {formatPercent(recommendation.foldEquity)} - SPR {recommendation.spr.toFixed(1)}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        {game.opponentStyle} - {game.anteLevel} - {game.tablePressure}
      </p>
    </div>

      <p className="mt-4 text-sm text-slate-400">
        {game.focus} - {game.difficulty}
      </p>
    </article>
  );
}
