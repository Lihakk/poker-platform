const suitNames: Record<string, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
const suitSymbols: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

export default function PlayingCard({ code, small = false }: { code: string; small?: boolean }) {
  const suit = code.slice(-1).toLowerCase();
  const rank = code.slice(0, -1).toUpperCase();
  const red = suit === 'h' || suit === 'd';

  return (
    <div className={`playing-card${small ? ' playing-card-small' : ''}${red ? ' playing-card-red' : ''}`} aria-label={`${rank} of ${suitNames[suit] ?? suit}`}>
      <span>{rank}</span>
      <span>{suitSymbols[suit] ?? suit}</span>
    </div>
  );
}
