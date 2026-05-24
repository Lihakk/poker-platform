import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { theorySections } from '../data/pokerTheory';
import { formatEv, formatPercent } from '../lib/pokerAdvisor';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function PokerMath() {
  const [pot, setPot] = useState(75);
  const [callAmount, setCallAmount] = useState(25);
  const [equity, setEquity] = useState(38);
  const [betSize, setBetSize] = useState(50);
  const [foldFrequency, setFoldFrequency] = useState(42);

  const math = useMemo(() => {
    const safePot = Math.max(pot, 1);
    const safeCall = Math.max(callAmount, 0);
    const safeBet = Math.max(betSize, 1);
    const equityPct = clamp(equity / 100, 0, 1);
    const foldPct = clamp(foldFrequency / 100, 0, 1);
    const finalPot = safePot + safeCall;
    const potOdds = safeCall / Math.max(finalPot, 1);
    const callEv = equityPct * finalPot - (1 - equityPct) * safeCall;
    const breakEvenFold = safeBet / (safeBet + safePot);
    const bluffEv = foldPct * safePot - (1 - foldPct) * safeBet;
    const semiBluffEv = foldPct * safePot + (1 - foldPct) * (equityPct * (safePot + safeBet) - (1 - equityPct) * safeBet);

    return { finalPot, potOdds, callEv, breakEvenFold, bluffEv, semiBluffEv };
  }, [betSize, callAmount, equity, foldFrequency, pot]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-300">Poker Math</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">EV, Odds, Equity, and Pressure</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Poker math is not about becoming a calculator at the table. It is about knowing which decisions print money, which ones are close,
              and which ones only feel good because the last result went your way.
            </p>
          </section>

          <aside className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-100">Core idea</p>
            <p className="mt-3 text-2xl font-black">A decision can lose today and still be correct.</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              EV judges the decision over repetitions. Results judge only the single card runout you happened to get.
            </p>
          </aside>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-black">Live EV Calculator</h2>
            <div className="mt-6 grid gap-5">
              <NumberField label="Current pot" value={pot} onChange={setPot} min={1} max={500} suffix="bb" />
              <NumberField label="Call amount" value={callAmount} onChange={setCallAmount} min={0} max={500} suffix="bb" />
              <NumberField label="Your estimated equity" value={equity} onChange={setEquity} min={0} max={100} suffix="%" />
              <NumberField label="Bet or bluff size" value={betSize} onChange={setBetSize} min={1} max={500} suffix="bb" />
              <NumberField label="Expected folds" value={foldFrequency} onChange={setFoldFrequency} min={0} max={100} suffix="%" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-black">Calculated Decision Read</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Metric label="Final pot after call" value={`${math.finalPot.toFixed(0)} bb`} tone="text-white" />
              <Metric label="Required equity" value={formatPercent(math.potOdds)} tone="text-amber-200" />
              <Metric label="Call EV" value={formatEv(math.callEv)} tone={math.callEv >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
              <Metric label="Break-even bluff folds" value={formatPercent(math.breakEvenFold)} tone="text-violet-200" />
              <Metric label="Pure bluff EV" value={formatEv(math.bluffEv)} tone={math.bluffEv >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
              <Metric label="Semi-bluff EV" value={formatEv(math.semiBluffEv)} tone={math.semiBluffEv >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
            </div>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Translation</p>
              <p className="mt-2 leading-7 text-slate-200">
                Your call needs {formatPercent(math.potOdds)} equity. With your estimate of {equity}%, the call is{' '}
                <span className={math.callEv >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>
                  {math.callEv >= 0 ? 'profitable' : 'not profitable'}
                </span>
                . A pure bluff of {betSize} bb needs folds about {formatPercent(math.breakEvenFold)} of the time.
              </p>
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {theorySections.map((section) => (
            <article key={section.title} className="rounded-lg border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Concept</p>
              <h2 className="mt-2 text-2xl font-black">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{section.summary}</p>
              {section.formula && <p className="mt-4 rounded-md bg-slate-950 p-3 font-mono text-sm text-amber-200">{section.formula}</p>}
              <p className="mt-4 text-sm leading-6 text-slate-400">{section.example}</p>

              <div className="mt-5 grid gap-2">
                {section.table.map((row) => (
                  <div key={row.label} className="grid gap-2 rounded-md border border-slate-800 bg-slate-950 p-3 sm:grid-cols-[140px_150px_1fr]">
                    <p className="font-bold text-slate-100">{row.label}</p>
                    <p className="text-amber-200">{row.value}</p>
                    <p className="text-sm text-slate-400">{row.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Common mistakes</p>
                <div className="mt-2 space-y-2">
                  {section.mistakes.map((mistake) => (
                    <p key={mistake} className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                      {mistake}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-amber-300">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent px-4 py-3 text-white outline-none"
        />
        <span className="grid w-14 place-items-center border-l border-slate-800 text-sm font-bold text-slate-500">{suffix}</span>
      </div>
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg bg-slate-950 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
