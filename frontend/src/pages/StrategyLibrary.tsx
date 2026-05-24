import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { glossaryTerms } from '../data/pokerTheory';

const studyPlans = [
  {
    title: 'Beginner Foundation',
    audience: 'New players',
    steps: ['Learn position before memorizing charts.', 'Practice pot odds with simple call/fold spots.', 'Play fewer weak offsuit hands out of position.'],
  },
  {
    title: 'Intermediate Decision Making',
    audience: 'Regular learners',
    steps: ['Estimate ranges by action, not vibes.', 'Compare call EV versus raise EV.', 'Track which villains overfold or overcall.'],
  },
  {
    title: 'Advanced Pressure',
    audience: 'Serious study',
    steps: ['Use blockers to choose river bluffs.', 'Plan turns before betting flops.', 'Adjust for SPR, ICM pressure, and equity realization.'],
  },
];

const rangeExamples = [
  {
    spot: 'UTG opens 6-max',
    likelyRange: 'Pairs, suited broadways, strong offsuit broadways, some suited aces',
    note: 'This range is strong because five players are still behind.',
  },
  {
    spot: 'Button opens after folds',
    likelyRange: 'Many suited hands, broadways, pairs, suited kings, connected hands',
    note: 'Position and fold equity allow wider opens.',
  },
  {
    spot: 'Big Blind defends',
    likelyRange: 'Broad but capped: suited hands, pairs, broadways, many hands that did not 3-bet',
    note: 'The Big Blind gets a discount but often plays out of position.',
  },
  {
    spot: 'River check-raise',
    likelyRange: 'Polar: very strong value or selected bluffs',
    note: 'Ask which missed draws exist before bluff-catching.',
  },
];

export default function StrategyLibrary() {
  const [category, setCategory] = useState('All');
  const categories = useMemo(() => ['All', ...Array.from(new Set(glossaryTerms.map((term) => term.category)))], []);
  const filteredTerms = useMemo(
    () => glossaryTerms.filter((term) => category === 'All' || term.category === category),
    [category],
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-fuchsia-300">Strategy Library</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Poker Concepts, Ranges, and Glossary</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Use this page as the “what does that mean?” layer. It explains the language behind the calculators and training spots.
          </p>
        </div>

        <div className="mb-8 grid gap-5 xl:grid-cols-3">
          {studyPlans.map((plan) => (
            <article key={plan.title} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">{plan.audience}</p>
              <h2 className="mt-2 text-2xl font-black">{plan.title}</h2>
              <div className="mt-4 space-y-2">
                {plan.steps.map((step, index) => (
                  <p key={step} className="rounded-md bg-slate-950 p-3 text-sm text-slate-300">
                    <span className="mr-2 font-black text-fuchsia-300">{index + 1}.</span>
                    {step}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-black">Range Thinking Examples</h2>
            <p className="mt-2 text-sm text-slate-400">
              Ranges are built from action, position, stack depth, and player type. Start broad, then remove hands as the line becomes more specific.
            </p>
            <div className="mt-5 grid gap-3">
              {rangeExamples.map((example) => (
                <div key={example.spot} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-black text-slate-100">{example.spot}</h3>
                    <span className="rounded-md bg-fuchsia-500/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-fuchsia-200">
                      Range
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{example.likelyRange}</p>
                  <p className="mt-2 text-sm text-slate-500">{example.note}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-fuchsia-100">Study habit</p>
            <p className="mt-3 text-2xl font-black">Always write the reason before the answer.</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              “Raise” is not a strategy. “Raise because villain overfolds, we block value, and SPR lets pressure work” is a strategy.
            </p>
          </aside>
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Glossary</p>
              <h2 className="mt-2 text-2xl font-black">Terms with Examples</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                    category === item ? 'border-fuchsia-300 bg-fuchsia-500/15 text-fuchsia-100' : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredTerms.map((term) => (
              <article key={term.term} className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black">{term.term}</h3>
                  <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold uppercase tracking-widest text-slate-300">{term.category}</span>
                </div>
                <p className="mt-3 leading-6 text-slate-300">{term.definition}</p>
                <p className="mt-3 rounded-md bg-slate-900 p-3 text-sm text-slate-400">{term.example}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
