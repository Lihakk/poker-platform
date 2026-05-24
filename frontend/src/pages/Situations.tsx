import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/axios';
import { estimateRecommendation, formatEv, formatPercent } from '../lib/pokerAdvisor';

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
  street: string;
  difficulty: string;
  villain_profile: string;
  focus: string;
  narrative_setup: string;
  actions: ScenarioAction[];
}

const splitCards = (cards: string) => cards.match(/.{1,2}/g) ?? [];

const actionLabel = (action: ScenarioAction) => {
  if (action.action_type === 'Raise' && action.raise_amount > 0) {
    return `${action.action_type} to ${action.raise_amount}`;
  }

  return action.action_type;
};

export default function Situations() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<ScenarioAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [streetFilter, setStreetFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  useEffect(() => {
    api
      .get('/scenarios')
      .then((res) => setScenarios(res.data))
      .finally(() => setLoading(false));
  }, []);

  const streetOptions = useMemo(() => ['All', ...Array.from(new Set(scenarios.map((scenario) => scenario.street).filter(Boolean)))], [scenarios]);
  const difficultyOptions = useMemo(() => ['All', ...Array.from(new Set(scenarios.map((scenario) => scenario.difficulty).filter(Boolean)))], [scenarios]);
  const filteredScenarios = useMemo(
    () =>
      scenarios.filter((scenario) => {
        const streetMatches = streetFilter === 'All' || scenario.street === streetFilter;
        const difficultyMatches = difficultyFilter === 'All' || scenario.difficulty === difficultyFilter;
        return streetMatches && difficultyMatches;
      }),
    [difficultyFilter, scenarios, streetFilter],
  );

  const activeScenario = filteredScenarios[activeIndex];
  const solvedCount = useMemo(() => (selectedAction ? activeIndex + 1 : activeIndex), [activeIndex, selectedAction]);
  const advisor = useMemo(() => {
    if (!activeScenario) return null;

    return estimateRecommendation({
      holeCards: activeScenario.hole_cards,
      boardCards: activeScenario.board_cards,
      potSize: activeScenario.pot_size,
      stackSize: activeScenario.stack_size,
      position: activeScenario.hero_position,
      opponentStyle: activeScenario.villain_profile,
      focus: activeScenario.focus,
      facingBet: activeScenario.actions.find((action) => action.action_type === 'Call')?.raise_amount,
    });
  }, [activeScenario]);

  const moveScenario = (direction: number) => {
    const nextIndex = Math.min(Math.max(activeIndex + direction, 0), filteredScenarios.length - 1);
    setActiveIndex(nextIndex);
    setSelectedAction(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Scenario Lab</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Simulated Situations</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Pick the action, then read the coach comment. These spots are designed to train position, equity, blockers, and pot control.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-widest text-slate-500">Progress</p>
            <p className="text-2xl font-black text-emerald-300">
              {Math.min(solvedCount, filteredScenarios.length)} / {filteredScenarios.length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Street</p>
            <div className="flex flex-wrap gap-2">
              {streetOptions.map((street) => (
                <button
                  key={street}
                  onClick={() => {
                    setStreetFilter(street);
                    setActiveIndex(0);
                    setSelectedAction(null);
                  }}
                  className={`rounded-md border px-3 py-2 text-sm font-bold ${
                    streetFilter === street ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100' : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  {street}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {difficultyOptions.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => {
                    setDifficultyFilter(difficulty);
                    setActiveIndex(0);
                    setSelectedAction(null);
                  }}
                  className={`rounded-md border px-3 py-2 text-sm font-bold ${
                    difficultyFilter === difficulty ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100' : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">Loading scenarios...</div>}

        {!loading && !activeScenario && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            No situations match those filters yet.
          </div>
        )}

        {activeScenario && (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-800 pb-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Hand {activeIndex + 1} of {scenarios.length}
                  </p>
                  <h2 className="mt-2 text-3xl font-black">{activeScenario.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                    <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-200">{activeScenario.street || 'Street'}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">{activeScenario.difficulty || 'Practice'}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">{activeScenario.focus || 'Decision making'}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">{activeScenario.villain_profile || 'Villain'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-md bg-slate-950 px-4 py-3">
                    <p className="text-slate-500">Position</p>
                    <p className="font-black text-white">{activeScenario.hero_position}</p>
                  </div>
                  <div className="rounded-md bg-slate-950 px-4 py-3">
                    <p className="text-slate-500">Pot</p>
                    <p className="font-black text-white">{activeScenario.pot_size} bb</p>
                  </div>
                  <div className="rounded-md bg-slate-950 px-4 py-3">
                    <p className="text-slate-500">Stack</p>
                    <p className="font-black text-white">{activeScenario.stack_size} bb</p>
                  </div>
                </div>
              </div>

              <div className="my-8 grid gap-6 lg:grid-cols-[260px_1fr]">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Hero Cards</p>
                  <div className="flex gap-3">
                    {splitCards(activeScenario.hole_cards).map((card) => (
                      <div key={card} className="grid h-24 w-16 place-items-center rounded-md bg-white text-2xl font-black text-slate-950 shadow-lg">
                        {card}
                      </div>
                    ))}
                  </div>

                  <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-slate-500">Board</p>
                  <div className="flex flex-wrap gap-2">
                    {splitCards(activeScenario.board_cards).length > 0 ? (
                      splitCards(activeScenario.board_cards).map((card) => (
                        <div key={card} className="grid h-16 w-11 place-items-center rounded-md bg-slate-100 text-sm font-black text-slate-950">
                          {card}
                        </div>
                      ))
                    ) : (
                      <span className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-400">Preflop</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Situation</p>
                  <p className="text-lg leading-8 text-slate-200">{activeScenario.narrative_setup}</p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {activeScenario.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => setSelectedAction(action)}
                        className={`rounded-lg border px-5 py-4 text-left font-bold transition ${
                          selectedAction?.id === action.id
                            ? action.is_optimal
                              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                              : 'border-rose-400 bg-rose-500/15 text-rose-100'
                            : 'border-slate-700 bg-slate-800 text-slate-100 hover:border-emerald-400'
                        }`}
                      >
                        {actionLabel(action)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedAction && (
                <div
                  className={`rounded-lg border p-5 ${
                    selectedAction.is_optimal ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10'
                  }`}
                >
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    {selectedAction.is_optimal ? 'Coach: strong decision' : 'Coach: review this line'}
                  </p>
                  <p className="mt-2 text-slate-100">{selectedAction.coach_comment}</p>
                  {advisor && (
                    <p className="mt-3 text-sm text-slate-300">
                      Estimated model line: {advisor.recommendation}. {advisor.reasoning}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-between gap-3">
                <button
                  onClick={() => moveScenario(-1)}
                  disabled={activeIndex === 0}
                  className="rounded-lg bg-slate-800 px-5 py-3 font-bold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => moveScenario(1)}
                  disabled={activeIndex === filteredScenarios.length - 1}
                  className="rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next Spot
                </button>
              </div>
            </section>

            <aside className="space-y-3">
              {advisor && (
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Estimated values</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-slate-950 p-3">
                      <p className="text-slate-500">Equity</p>
                      <p className="text-lg font-black">{formatPercent(advisor.equity)}</p>
                    </div>
                    <div className="rounded-md bg-slate-950 p-3">
                      <p className="text-slate-500">Pot odds</p>
                      <p className="text-lg font-black">{formatPercent(advisor.potOdds)}</p>
                    </div>
                    <div className="rounded-md bg-slate-950 p-3">
                      <p className="text-slate-500">Call EV</p>
                      <p className="text-lg font-black">{formatEv(advisor.callEv)}</p>
                    </div>
                    <div className="rounded-md bg-slate-950 p-3">
                      <p className="text-slate-500">Raise EV</p>
                      <p className="text-lg font-black">{formatEv(advisor.raiseEv)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Calculator line</p>
                    <p className="mt-1 text-2xl font-black">{advisor.recommendation}</p>
                    <p className="mt-2 text-sm text-slate-300">{advisor.handClass} - {advisor.texture}</p>
                  </div>
                </div>
              )}

              {filteredScenarios.map((scenario, index) => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setActiveIndex(index);
                    setSelectedAction(null);
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    activeIndex === index ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Spot {index + 1}</p>
                  <p className="mt-1 font-bold text-slate-100">{scenario.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {scenario.hero_position} - {scenario.hole_cards}
                  </p>
                </button>
              ))}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
