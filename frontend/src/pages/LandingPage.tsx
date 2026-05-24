import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import heroImage from '../assets/hero.png';

const featureCards = [
  {
    title: 'Learn the math',
    description: 'EV, pot odds, equity realization, fold equity, blockers, and SPR explained with live calculators.',
    stat: '6',
    label: 'core concepts',
  },
  {
    title: 'Practice real decisions',
    description: 'Run custom games, AI hands, full simulations, and street-specific situations with coach feedback.',
    stat: '4',
    label: 'practice modes',
  },
  {
    title: 'Build table instincts',
    description: 'Study ranges, opponent profiles, tournament pressure, and full-hand planning before you sit down.',
    stat: '100+',
    label: 'decision cues',
  },
];

const simulatorSteps = [
  'Deal a heads-up hand',
  'Estimate equity and EV',
  'Choose fold, call, or raise',
  'Review stack, pot, and coach note',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-2xl font-black tracking-tight">
          POKER<span className="text-blue-400">LEARN</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="rounded-md px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-900 hover:text-white">
            Log in
          </Link>
          <Link to="/register" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500">
            Start training
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-[1fr_560px] lg:items-center">
          <div className="landing-slide-up relative z-10">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">Poker training platform</p>
            <h1 className="mt-5 max-w-4xl text-6xl font-black leading-none tracking-tight text-white lg:text-7xl">
              Study the spot before the table makes it expensive.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Learn poker theory, calculate EV, play full simulated hands, drill AI opponents, and review coached situations from one focused training hub.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-lg bg-blue-600 px-6 py-4 font-black text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500">
                Create free account
              </Link>
              <Link to="/login" className="rounded-lg border border-slate-700 bg-slate-900 px-6 py-4 font-black text-slate-100 transition hover:border-blue-400">
                I already have one
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              <Metric value="EV" label="decision math" />
              <Metric value="AI" label="opponent drills" />
              <Metric value="HUD" label="study dashboard" />
            </div>
          </div>

          <div className="relative min-h-[560px]">
            <div className="landing-pulse-ring absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/30 bg-blue-500/10" />
            <div className="absolute left-1/2 top-1/2 h-[360px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-emerald-400/40 bg-emerald-950/70 shadow-2xl shadow-emerald-950/60" />
            <div className="absolute left-1/2 top-1/2 h-[270px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-emerald-300/20 bg-slate-950/70" />

            <img
              src={heroImage}
              alt="Poker learning platform layers"
              className="landing-card-float absolute left-1/2 top-12 z-20 h-44 -translate-x-1/2 drop-shadow-2xl"
              style={{ '--rotate': '0deg' } as CSSProperties}
            />

            <Card className="left-[18%] top-[42%]" rank="A" suit="♠" rotate="-12deg" delay="0s" />
            <Card className="left-[34%] top-[49%]" rank="K" suit="♥" rotate="8deg" delay="0.4s" />
            <Card className="right-[26%] top-[42%]" rank="Q" suit="♦" rotate="-4deg" delay="0.8s" />
            <Card className="right-[12%] top-[52%]" rank="J" suit="♣" rotate="14deg" delay="1.2s" />

            <div className="absolute bottom-12 left-1/2 z-30 w-[min(92%,460px)] -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Current trainer</p>
                  <p className="mt-1 text-xl font-black">Full hand simulation</p>
                </div>
                <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-right">
                  <p className="text-xs uppercase tracking-widest text-emerald-200">Line</p>
                  <p className="font-black text-emerald-100">Raise +EV</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                {simulatorSteps.map((step, index) => (
                  <div key={step} className="rounded-md bg-slate-950 p-2 text-slate-300">
                    <p className="font-black text-blue-300">{index + 1}</p>
                    <p className="mt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-slate-900/60 px-6 py-14">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <article
                key={feature.title}
                className="landing-slide-up rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/20"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-black">{feature.title}</h2>
                  <div className="rounded-md bg-blue-500/10 px-3 py-2 text-right">
                    <p className="text-xl font-black text-blue-200">{feature.stat}</p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">{feature.label}</p>
                  </div>
                </div>
                <p className="mt-4 leading-7 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[420px_1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">Inside the app</p>
            <h2 className="mt-3 text-4xl font-black">Theory, calculators, quizzes, and actual hands.</h2>
            <p className="mt-4 leading-7 text-slate-400">
              PokerLearn is built around the loop serious players use: learn the concept, estimate the value, play the spot, review the mistake, repeat.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {['Poker Math', 'Strategy Library', 'Game Simulator', 'AI Games', 'Custom Games', 'Coached Situations'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <p className="text-lg font-black">{item}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-3/4 rounded-full bg-blue-500" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  );
}

function Card({ className, rank, suit, rotate, delay }: { className: string; rank: string; suit: string; rotate: string; delay: string }) {
  const redSuit = suit === '♥' || suit === '♦';

  return (
    <div
      className={`landing-card-float absolute z-20 grid h-28 w-20 place-items-center rounded-lg bg-white text-3xl font-black shadow-2xl ${className} ${
        redSuit ? 'text-rose-600' : 'text-slate-950'
      }`}
      style={{ '--rotate': rotate, animationDelay: delay } as CSSProperties}
    >
      <div className="text-center leading-none">
        <p>{rank}</p>
        <p className="text-2xl">{suit}</p>
      </div>
    </div>
  );
}
