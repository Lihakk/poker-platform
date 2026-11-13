import { Link } from 'react-router-dom';
import heroImage from '../assets/poker-table-hero.webp';

const trainingModes = [
  { number: '01', title: 'Understand the game', detail: 'Build your foundation with lessons, strategy notes, and clear explanations of every important concept.', tag: 'Learn' },
  { number: '02', title: 'Work out the value', detail: 'Turn equity, pot odds, fold equity, and expected value into decisions you can actually use.', tag: 'Calculate' },
  { number: '03', title: 'Play the spot', detail: 'Create a table, face AI opponents, or play a full hand from the first blind to the final chip.', tag: 'Practice' },
  { number: '04', title: 'Review your thinking', detail: 'Test a line in a coached situation and see why another action might perform better.', tag: 'Improve' },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="wordmark" aria-label="PokerLearn home"><span className="wordmark-mark">♠</span> POKER<span>LEARN</span></Link>
        <nav aria-label="Main navigation">
          <a href="#experience" className="landing-header-link">Explore</a>
          <Link to="/login" className="landing-header-link">Log in</Link>
          <Link to="/register" className="landing-header-cta">Start learning <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <img className="landing-hero-image" src={heroImage} alt="Ace and king of spades on a green poker table beside a stack of chips" fetchPriority="high" />
          <div className="landing-hero-shade" />
          <div className="landing-hero-content">
            <p className="eyebrow"><span className="eyebrow-line" /> The poker learning platform</p>
            <h1 id="landing-title">PokerLearn</h1>
            <p className="landing-hero-copy">Learn the theory, calculate the odds, and practice real decisions before they cost you at the table.</p>
            <div className="landing-hero-actions">
              <Link to="/register" className="button-primary">Start training <span aria-hidden="true">↗</span></Link>
              <a href="#experience" className="button-secondary">Explore the platform <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="landing-hero-bottom"><span>BUILT FOR BETTER DECISIONS</span><span>SCROLL TO EXPLORE ↓</span></div>
        </section>

        <section id="experience" className="landing-intro content-band">
          <div className="content-inner landing-intro-grid">
            <div><p className="eyebrow">A complete training loop</p><h2>From a hunch to<br /><em>a reasoned decision.</em></h2></div>
            <p>PokerLearn connects the parts of studying that usually live in separate places. Learn a concept, test it with live calculations, play it in a simulated hand, and review your thinking with focused feedback.</p>
          </div>
        </section>

        <section className="content-band landing-modes">
          <div className="content-inner">
            <div className="section-heading"><p className="eyebrow">How you get better</p><h2>One decision at a time.</h2></div>
            <div className="mode-grid">
              {trainingModes.map((mode) => (
                <Link to="/register" className="mode-item" key={mode.number}>
                  <div className="mode-item-top"><span>{mode.number}</span><span>{mode.tag}</span></div>
                  <div><h3>{mode.title}</h3><p>{mode.detail}</p></div>
                  <span className="mode-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="content-band landing-proof">
          <div className="content-inner landing-proof-grid">
            <div className="proof-visual" aria-label="Example poker decision">
              <div className="proof-visual-top"><span>DECISION LAB / 01</span><span>FLOP · 100 BB</span></div>
              <div className="proof-board"><span>A<span>♠</span></span><span>J<span>♥</span></span><span>7<span>♠</span></span></div>
              <p className="proof-caption">A strong draw. A difficult decision.</p>
              <div className="proof-stat"><span>POT ODDS</span><strong>25%</strong><span>EST. EQUITY</span><strong>38%</strong></div>
              <div className="proof-answer"><span>THE QUESTION</span><p>Call, raise, or let it go?</p></div>
            </div>
            <div className="proof-copy"><p className="eyebrow">More than a quiz</p><h2>See the numbers.<br /><em>Understand the line.</em></h2><p>Explore EV, equity, and opponent behavior in the same place you play. The answer is useful, but understanding how you arrived there is what stays with you.</p><Link to="/register" className="text-link">Explore training <span aria-hidden="true">↗</span></Link></div>
          </div>
        </section>

        <section className="landing-final content-band"><div className="content-inner"><p className="eyebrow">Your next hand starts here</p><h2>Make the next decision<br /><em>your best one.</em></h2><Link to="/register" className="button-primary">Create your account <span aria-hidden="true">↗</span></Link></div></section>
      </main>
      <footer className="landing-footer"><div className="content-inner"><span className="wordmark"><span className="wordmark-mark">♠</span> POKER<span>LEARN</span></span><span>Study the game. Trust the process.</span><div><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></div></div></footer>
    </div>
  );
}
