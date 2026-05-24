import { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { estimateRecommendation, formatEv, formatPercent, type PlayerAction } from '../lib/pokerAdvisor';

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

const hands: AiHand[] = [
  {
    id: 1,
    title: 'Loose blind defender',
    heroHand: 'AdKd',
    board: 'Kc8d4s',
    pot: 48,
    stack: 126,
    position: 'BTN',
    aiProfile: 'Loose-passive',
    prompt: 'You opened Button and the Big Blind called. They check the dry flop.',
    facingBet: 0,
  },
  {
    id: 2,
    title: 'Aggressive turn check-raise',
    heroHand: 'JcJs',
    board: 'Ts8s3dQh',
    pot: 82,
    stack: 94,
    position: 'CO',
    aiProfile: 'Aggressive regular',
    prompt: 'You c-bet flop, checked back turn card is facing a delayed bet line from the AI.',
    facingBet: 36,
  },
  {
    id: 3,
    title: 'Missed draw river',
    heroHand: '9s8s',
    board: 'As7s2c4dKd',
    pot: 66,
    stack: 112,
    position: 'BB',
    aiProfile: 'Tight caller',
    prompt: 'You defended preflop and missed the flush. The AI makes a small river bet after checking turn.',
    facingBet: 24,
  },
  {
    id: 4,
    title: 'Thin value after missed draw',
    heroHand: 'KcQh',
    board: 'Qs9d4c2s6h',
    pot: 84,
    stack: 130,
    position: 'BTN',
    aiProfile: 'Sticky bluff-catcher',
    prompt: 'You bet flop, checked turn, and the Big Blind checks a blank river.',
    facingBet: 0,
  },
  {
    id: 5,
    title: 'Short stack reshove node',
    heroHand: '7h7d',
    board: '',
    pot: 7,
    stack: 18,
    position: 'CO',
    aiProfile: 'Loose opener',
    prompt: 'Hijack opens in an ante tournament. You have a medium pair and shallow stack behind.',
    facingBet: 5,
  },
  {
    id: 6,
    title: 'Wet flop overpair',
    heroHand: 'AsAd',
    board: 'JsTs8d',
    pot: 54,
    stack: 122,
    position: 'UTG',
    aiProfile: 'Combo-draw heavy',
    prompt: 'Button calls your UTG open and the flop is coordinated with two spades.',
    facingBet: 0,
  },
  {
    id: 7,
    title: 'Ace-high river bluff catch',
    heroHand: 'AhJh',
    board: 'Kd7c3s3h2d',
    pot: 58,
    stack: 88,
    position: 'BB',
    aiProfile: 'Missed c-bettor',
    prompt: 'Button c-bet flop, checked turn, then bets small on a blank river.',
    facingBet: 18,
  },
  {
    id: 8,
    title: 'Small blind squeeze',
    heroHand: 'AcKd',
    board: '',
    pot: 9,
    stack: 96,
    position: 'SB',
    aiProfile: 'Loose opener',
    prompt: 'Cutoff opens, Button calls, and the Big Blind is tight behind you.',
    facingBet: 3,
  },
];

const splitCards = (cards: string) => cards.match(/.{1,2}/g) ?? [];

const responseTone = {
  Fold: 'The AI shuts down and protects chips.',
  Call: 'The AI keeps ranges wide and takes the hand to the next node.',
  Raise: 'The AI applies pressure and tests whether your line is capped.',
};

const profileOptions = ['Use hand profile', 'Loose-passive', 'Balanced regular', 'Aggressive regular', 'Tight caller'];

const estimateAiResponse = (profile: string, heroAction: PlayerAction, foldEquity: number): PlayerAction => {
  const normalizedProfile = profile.toLowerCase();
  if (heroAction === 'Fold') return 'Call';
  if (heroAction === 'Call' && normalizedProfile.includes('aggressive')) return 'Raise';
  if (heroAction === 'Raise' && normalizedProfile.includes('tight') && foldEquity > 0.38) return 'Fold';
  if (heroAction === 'Raise' && normalizedProfile.includes('loose')) return 'Call';
  if (heroAction === 'Raise' && foldEquity > 0.52) return 'Fold';
  return heroAction === 'Raise' ? 'Call' : 'Raise';
};

export default function AiGames() {
  const [handIndex, setHandIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<PlayerAction | null>(null);
  const [score, setScore] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [profileOverride, setProfileOverride] = useState(profileOptions[0]);

  const hand = hands[handIndex];
  const activeProfile = profileOverride === 'Use hand profile' ? hand.aiProfile : profileOverride;
  const advisor = useMemo(
    () =>
      estimateRecommendation({
        holeCards: hand.heroHand,
        boardCards: hand.board,
        potSize: hand.pot,
        stackSize: hand.stack,
        position: hand.position,
        opponentStyle: activeProfile,
        facingBet: hand.facingBet,
      }),
    [activeProfile, hand],
  );
  const aiResponse = selectedAction ? estimateAiResponse(activeProfile, selectedAction, advisor.foldEquity) : null;
  const hasAnswered = selectedAction !== null;
  const isCorrect = selectedAction === advisor.recommendation;

  const coachLine = useMemo(() => {
    if (!selectedAction) return 'Choose your line before the AI responds.';
    if (isCorrect) return `Correct. ${advisor.reasoning}`;
    return `Not ideal. The calculator prefers ${advisor.recommendation}. ${advisor.reasoning}`;
  }, [advisor.reasoning, advisor.recommendation, isCorrect, selectedAction]);

  const chooseAction = (action: PlayerAction) => {
    if (hasAnswered) return;
    setSelectedAction(action);
    setHandsPlayed((currentCount) => currentCount + 1);
    if (action === advisor.recommendation) {
      setScore((currentScore) => currentScore + 1);
    }
  };

  const nextHand = () => {
    setHandIndex((currentIndex) => (currentIndex + 1) % hands.length);
    setSelectedAction(null);
  };

  const randomHand = () => {
    setHandIndex((currentIndex) => {
      const nextIndex = Math.floor(Math.random() * hands.length);
      return nextIndex === currentIndex ? (nextIndex + 1) % hands.length : nextIndex;
    });
    setSelectedAction(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-400">AI Games</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Play Against Training AI</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Face compact rule-based opponent profiles and get a coaching note after every decision.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-widest text-slate-500">Session score</p>
            <p className="text-2xl font-black text-violet-300">
              {score} / {handsPlayed}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-800 pb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">AI profile: {activeProfile}</p>
                <h2 className="mt-2 text-3xl font-black">{hand.title}</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md bg-slate-950 px-4 py-3">
                  <p className="text-slate-500">Position</p>
                  <p className="font-black">{hand.position}</p>
                </div>
                <div className="rounded-md bg-slate-950 px-4 py-3">
                  <p className="text-slate-500">Pot</p>
                  <p className="font-black">{hand.pot} bb</p>
                </div>
                <div className="rounded-md bg-slate-950 px-4 py-3">
                  <p className="text-slate-500">Stack</p>
                  <p className="font-black">{hand.stack} bb</p>
                </div>
              </div>
            </div>

            <div className="my-8 grid gap-6 lg:grid-cols-[250px_1fr]">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Your hand</p>
                <div className="flex gap-3">
                  {splitCards(hand.heroHand).map((card) => (
                    <div key={card} className="grid h-24 w-16 place-items-center rounded-md bg-white text-2xl font-black text-slate-950 shadow-lg">
                      {card}
                    </div>
                  ))}
                </div>
                <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-slate-500">Board</p>
                <div className="flex flex-wrap gap-2">
                  {splitCards(hand.board).map((card) => (
                    <div key={card} className="grid h-16 w-11 place-items-center rounded-md bg-slate-100 text-sm font-black text-slate-950">
                      {card}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Hand prompt</p>
                <p className="text-lg leading-8 text-slate-200">{hand.prompt}</p>

                <div className="mt-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Opponent override</p>
                  <div className="flex flex-wrap gap-2">
                    {profileOptions.map((profile) => (
                      <button
                        key={profile}
                        onClick={() => {
                          setProfileOverride(profile);
                          setSelectedAction(null);
                        }}
                        className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                          profileOverride === profile ? 'border-violet-400 bg-violet-500/15 text-violet-100' : 'border-slate-700 bg-slate-800 text-slate-300'
                        }`}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {(['Fold', 'Call', 'Raise'] as PlayerAction[]).map((action) => (
                    <button
                      key={action}
                      onClick={() => chooseAction(action)}
                      className={`rounded-lg border px-5 py-4 text-left font-bold transition ${
                        selectedAction === action
                          ? action === advisor.recommendation
                            ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                            : 'border-rose-400 bg-rose-500/15 text-rose-100'
                          : 'border-slate-700 bg-slate-800 text-slate-100 hover:border-violet-400'
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">AI response</p>
                <p className="mt-2 text-2xl font-black text-violet-300">{aiResponse ?? 'Waiting'}</p>
                <p className="mt-2 text-slate-400">{aiResponse ? responseTone[aiResponse] : 'Your action will trigger the opponent line.'}</p>
              </div>

              <div className={`rounded-lg border p-5 ${hasAnswered && isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Coach comment</p>
                <p className="mt-2 text-slate-100">{coachLine}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={nextHand} disabled={!hasAnswered} className="rounded-lg bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40">
                Next AI Hand
              </button>
              <button onClick={randomHand} className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 font-bold text-slate-100 transition hover:border-violet-400">
                Random Spot
              </button>
            </div>
          </section>

          <aside className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Estimated values</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-950 p-3">
                <p className="text-slate-500">Equity</p>
                <p className="text-xl font-black text-white">{formatPercent(advisor.equity)}</p>
              </div>
              <div className="rounded-md bg-slate-950 p-3">
                <p className="text-slate-500">Pot odds</p>
                <p className="text-xl font-black text-white">{formatPercent(advisor.potOdds)}</p>
              </div>
              <div className="rounded-md bg-slate-950 p-3">
                <p className="text-slate-500">Call EV</p>
                <p className="text-xl font-black text-white">{formatEv(advisor.callEv)}</p>
              </div>
              <div className="rounded-md bg-slate-950 p-3">
                <p className="text-slate-500">Raise EV</p>
                <p className="text-xl font-black text-white">{formatEv(advisor.raiseEv)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
              <p className="text-sm font-bold uppercase tracking-widest text-violet-200">Recommended</p>
              <p className="mt-2 text-2xl font-black">{advisor.recommendation}</p>
              <p className="mt-2 text-sm text-slate-300">{advisor.handClass} - {advisor.texture}</p>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {advisor.drills.map((drill) => (
                <p key={drill}>{drill}</p>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
