import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Pencil, Save, Spade, Trash2 } from "lucide-react";
import PageShell from "../components/PageShell";
import { Switch } from "../components/ui/switch";
import { PROFILES } from "../lib/holdem";
import {
  useProgress,
  useProgressStore,
  type TableSetup,
} from "../store/useProgressStore";

const presets: Omit<TableSetup, "id">[] = [
  {
    name: "Balanced six-max",
    players: 5,
    stack: 100,
    hands: 10,
    profile: "Mixed table",
    coach: true,
  },
  {
    name: "Heads-up pressure",
    players: 1,
    stack: 100,
    hands: 10,
    profile: "Aggressive regular",
    coach: false,
  },
  {
    name: "Short-stack decisions",
    players: 3,
    stack: 20,
    hands: 20,
    profile: "Balanced regular",
    coach: true,
  },
  {
    name: "Deep value practice",
    players: 2,
    stack: 200,
    hands: 10,
    profile: "Loose-passive",
    coach: true,
  },
];
export default function CustomGames() {
  const [setup, setSetup] = useState<TableSetup>({ ...presets[0], id: "" });
  const [saved, setSaved] = useState(false);
  const progress = useProgress();
  const save = useProgressStore((state) => state.saveSetup);
  const remove = useProgressStore((state) => state.removeSetup);
  function change(update: Partial<TableSetup>) {
    setSetup((current) => ({ ...current, ...update }));
    setSaved(false);
  }
  function saveCurrent() {
    const next = {
      ...setup,
      id: setup.id || crypto.randomUUID(),
      name: setup.name.trim(),
    };
    if (!next.name) return;
    save(next);
    setSetup(next);
    setSaved(true);
  }
  return (
    <PageShell>
      <header className="training-header">
        <div>
          <p className="eyebrow">Practice / Your table</p>
          <h1>
            Make it <em>your game.</em>
          </h1>
          <p>
            Build a repeatable session around the stack depth and opponents you
            want to study.
          </p>
        </div>
        <Spade size={36} className="workbench-icon" />
      </header>
      <div className="custom-workbench">
        <section className="custom-settings">
          <label>
            Session name
            <input
              value={setup.name}
              maxLength={80}
              onChange={(event) => change({ name: event.target.value })}
            />
          </label>
          <label>
            Start from a practice preset
            <select
              value=""
              onChange={(event) => {
                setSetup({ ...presets[Number(event.target.value)], id: "" });
                setSaved(false);
              }}
            >
              <option value="" disabled>
                Choose a preset
              </option>
              {presets.map((preset, i) => (
                <option key={preset.name} value={i}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <div className="custom-setting-grid">
            <label>
              AI opponents
              <select
                aria-label="AI opponents"
                value={setup.players}
                onChange={(event) =>
                  change({ players: Number(event.target.value) })
                }
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Session hands
              <select
                aria-label="Session hands"
                value={setup.hands}
                onChange={(event) =>
                  change({ hands: Number(event.target.value) })
                }
              >
                {[5, 10, 20, 50].map((count) => (
                  <option key={count}>{count}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Starting stack <strong>{setup.stack} bb</strong>
            <input
              type="range"
              aria-label="Starting stack"
              min={20}
              max={300}
              step={5}
              value={setup.stack}
              onChange={(event) =>
                change({ stack: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Opponent style
            <select
              aria-label="Opponent style"
              value={setup.profile}
              onChange={(event) => change({ profile: event.target.value })}
            >
              {["Mixed table", ...PROFILES].map((profile) => (
                <option key={profile}>{profile}</option>
              ))}
            </select>
          </label>
          <label className="custom-checkbox">
            <Switch
              aria-label="Show the coach's estimates"
              checked={setup.coach}
              onCheckedChange={(checked) => change({ coach: checked })}
            />
            <span>Show the coach’s estimates</span>
          </label>
          <button
            className="quiet-button"
            disabled={!setup.name.trim() || saved}
            onClick={saveCurrent}
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? "Setup saved" : setup.id ? "Save changes" : "Save setup"}
          </button>
        </section>
        <section className="custom-preview">
          <p className="eyebrow">Session preview</p>
          <h2>{setup.name || "Your practice session"}</h2>
          <div className="preview-seat-diagram">
            <div className="preview-table-mark">
              <Spade size={35} />
            </div>
            {Array.from({ length: setup.players + 1 }, (_, index) => (
              <span
                key={index}
                className={`preview-player preview-player-${index}`}
              >
                {index === 0 ? "YOU" : `AI ${index}`}
              </span>
            ))}
          </div>
          <div className="custom-preview-stats">
            <span>
              <strong>{setup.players + 1}</strong> seats
            </span>
            <span>
              <strong>{setup.stack}</strong> bb
            </span>
            <span>
              <strong>{setup.hands}</strong> hands
            </span>
          </div>
          <p>
            {setup.profile} ·{" "}
            {setup.coach ? "Coach visible" : "Independent play"} · Blinds 0.5 /
            1 bb
          </p>
          <Link
            to="/game-simulator"
            state={{ config: setup }}
            className="button-primary"
          >
            Play this setup
            <ArrowRight size={18} />
          </Link>
          <Link to="/equity-lab" className="custom-secondary-link">
            Need to test a specific hand? Open the equity lab
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section className="saved-setups">
        <div className="section-title">
          <h2>Saved practice tables</h2>
          <span>{progress.setups?.length ?? 0} setups</span>
        </div>
        <div className="setup-list">
          {(progress.setups ?? []).map((item) => (
            <article key={item.id}>
              <div>
                <p className="eyebrow">
                  {item.players === 1 ? "Heads-up" : `${item.players + 1}-max`}
                </p>
                <button
                  className="icon-button"
                  title="Delete setup"
                  aria-label={`Delete setup: ${item.name}`}
                  onClick={() => remove(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3>{item.name}</h3>
              <p>
                {item.stack} bb · {item.hands} hands · {item.profile}
              </p>
              <footer>
                <button
                  className="quiet-button"
                  onClick={() => {
                    setSetup(item);
                    setSaved(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <Link
                  className="text-link"
                  to="/game-simulator"
                  state={{ config: item }}
                >
                  Play
                  <ArrowRight size={16} />
                </Link>
              </footer>
            </article>
          ))}
        </div>
        {!progress.setups?.length && (
          <p className="empty-message">
            No saved tables yet. Save the session above to return to it later.
          </p>
        )}
      </section>
    </PageShell>
  );
}
