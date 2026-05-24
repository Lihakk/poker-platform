import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../lib/axios';

interface Lesson {
  id: number;
  title: string;
}

interface Quiz {
  id: number;
  title: string;
}

interface Scenario {
  id: number;
  title: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  quizzes: Quiz[];
  scenarios: Scenario[];
}

const practiceTiles = [
  {
    title: 'Poker Math',
    description: 'Learn EV, pot odds, equity realization, SPR, and fold equity with live calculators.',
    to: '/poker-math',
    accentClass: 'text-amber-300',
    hoverClass: 'hover:border-amber-300',
  },
  {
    title: 'Strategy Library',
    description: 'Study ranges, blockers, tournament pressure, and key poker terms in plain language.',
    to: '/strategy-library',
    accentClass: 'text-fuchsia-300',
    hoverClass: 'hover:border-fuchsia-300',
  },
  {
    title: 'Custom Games',
    description: 'Build practice tables by format, stack depth, blinds, and focus area.',
    to: '/custom-games',
    accentClass: 'text-cyan-400',
    hoverClass: 'hover:border-cyan-400',
  },
  {
    title: 'AI Games',
    description: 'Play compact hands against opponent profiles with immediate coaching.',
    to: '/ai-games',
    accentClass: 'text-violet-400',
    hoverClass: 'hover:border-violet-400',
  },
  {
    title: 'Game Simulator',
    description: 'Play full heads-up hands with streets, stacks, pot movement, opponent responses, and showdown.',
    to: '/game-simulator',
    accentClass: 'text-teal-300',
    hoverClass: 'hover:border-teal-300',
  },
  {
    title: 'Simulated Situations',
    description: 'Solve curated spots and compare your line to the coach comment.',
    to: '/situations',
    accentClass: 'text-emerald-400',
    hoverClass: 'hover:border-emerald-400',
  },
];

export default function Dashboard() {
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    api.get('/modules').then((res) => setModules(res.data));
  }, []);

  const totals = useMemo(
    () =>
      modules.reduce(
        (summary, mod) => ({
          lessons: summary.lessons + (mod.lessons?.length ?? 0),
          quizzes: summary.quizzes + (mod.quizzes?.length ?? 0),
          scenarios: summary.scenarios + (mod.scenarios?.length ?? 0),
        }),
        { lessons: 0, quizzes: 0, scenarios: 0 },
      ),
    [modules],
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Training Hub</p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
              Learning <span className="text-blue-500">Path</span>
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">Master Texas Hold'em with lessons, quizzes, custom games, AI hands, coached situations, and estimated-value recommendations.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Lessons</p>
                <p className="mt-1 text-2xl font-black">{totals.lessons}</p>
              </div>
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Quizzes</p>
                <p className="mt-1 text-2xl font-black">{totals.quizzes}</p>
              </div>
              <div className="rounded-md bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Scenarios</p>
                <p className="mt-1 text-2xl font-black">{totals.scenarios}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-200">Suggested session</p>
            <div className="mt-4 space-y-3">
              <Link to="/custom-games" className="block rounded-md border border-blue-400/20 bg-slate-950/60 p-3 text-sm font-bold text-slate-100 transition hover:border-blue-300">
                1. Build one custom table for today's focus.
              </Link>
              <Link to="/ai-games" className="block rounded-md border border-violet-400/20 bg-slate-950/60 p-3 text-sm font-bold text-slate-100 transition hover:border-violet-300">
                2. Play five AI hands against a profile override.
              </Link>
              <Link to="/game-simulator" className="block rounded-md border border-teal-400/20 bg-slate-950/60 p-3 text-sm font-bold text-slate-100 transition hover:border-teal-300">
                3. Run one full hand simulation to showdown.
              </Link>
              <Link to="/situations" className="block rounded-md border border-emerald-400/20 bg-slate-950/60 p-3 text-sm font-bold text-slate-100 transition hover:border-emerald-300">
                4. Review two coached situations by street.
              </Link>
            </div>
          </aside>
        </div>

        <div className="mb-10 grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
          {practiceTiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className={`rounded-lg border border-slate-800 bg-slate-900 p-5 transition ${tile.hoverClass}`}
            >
              <p className={`text-sm font-bold uppercase tracking-widest ${tile.accentClass}`}>Practice Mode</p>
              <h2 className="mt-2 text-2xl font-black">{tile.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{tile.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid max-w-6xl gap-6 lg:grid-cols-2">
          {modules.map((mod) => (
            <section key={mod.id} className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">{mod.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{mod.description}</p>
                </div>
                <div className="rounded-md bg-slate-950 px-3 py-2 text-right">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Items</p>
                  <p className="font-black">{(mod.lessons?.length ?? 0) + (mod.quizzes?.length ?? 0) + (mod.scenarios?.length ?? 0)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Lessons</h3>
                  <div className="space-y-2">
                    {mod.lessons?.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/lesson/${lesson.id}`}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 font-medium text-slate-200 transition hover:border-blue-500"
                      >
                        <span>{lesson.title}</span>
                        <span className="text-sm text-blue-300">Open</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Quizzes</h3>
                  <div className="space-y-2">
                    {mod.quizzes?.map((quiz) => (
                      <Link
                        key={quiz.id}
                        to={`/quiz/${quiz.id}`}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 font-medium text-slate-200 transition hover:border-indigo-500"
                      >
                        <span>{quiz.title}</span>
                        <span className="text-sm text-indigo-300">Start</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {mod.scenarios?.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Scenario Practice</h3>
                    <Link
                      to="/situations"
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 font-medium text-slate-200 transition hover:border-emerald-500"
                    >
                      <span>{mod.scenarios.length} coached situations</span>
                      <span className="text-sm text-emerald-300">Train</span>
                    </Link>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
