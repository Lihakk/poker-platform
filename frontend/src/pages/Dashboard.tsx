import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  Settings2,
  Spade,
  Target,
} from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../lib/axios";
import { curriculum } from "../data/curriculum";
import { useAuthStore } from "../store/useAuthStore";
import { useProgress } from "../store/useProgressStore";

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: { id: number; title: string }[];
  quizzes: { id: number; title: string }[];
}
const practice = [
  {
    title: "Game simulator",
    text: "Every street. Every decision.",
    path: "/game-simulator",
    icon: Spade,
    tone: "green",
  },
  {
    title: "Decision lab",
    text: "A spot, a size, a reason.",
    path: "/ai-games",
    icon: BrainCircuit,
    tone: "gold",
  },
  {
    title: "Situation room",
    text: "Read the line. Test your thinking.",
    path: "/situations",
    icon: Target,
    tone: "red",
  },
  {
    title: "Equity lab",
    text: "Your cards. Your opponent range.",
    path: "/equity-lab",
    icon: FlaskConical,
    tone: "silver",
  },
];
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const progress = useProgress();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let stale = false;
    api
      .get("/modules")
      .then(({ data }) => {
        if (!stale) setModules(data);
      })
      .catch(() => {
        if (!stale) setError(true);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [retry]);
  const completed = curriculum.filter((topic) =>
    progress.lessons.includes(topic.slug),
  ).length;
  const next = curriculum.find(
    (topic) => !progress.lessons.includes(topic.slug),
  );
  const attempts = Object.values(progress.quizzes).reduce(
    (total, result) => total + result.attempts,
    0,
  );
  const conceptData = Object.entries(progress.concepts)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 4);

  return (
    <PageShell>
      <header className="training-header">
        <div>
          <p className="eyebrow">Learning hub / {user?.username ?? "Player"}</p>
          <h1>
            Your next <em>good decision.</em>
          </h1>
          <p>A little study, a few hands, and a reason you can explain.</p>
        </div>
        <Link to="/custom-games" className="quiet-button">
          <Settings2 size={17} />
          Build a practice table
        </Link>
      </header>
      <div className="hub-stats">
        <div>
          <span>COURSE PROGRESS</span>
          <strong>
            {completed}
            <small> / {curriculum.length}</small>
          </strong>
        </div>
        <div>
          <span>QUIZ ATTEMPTS</span>
          <strong>{attempts}</strong>
        </div>
        <div>
          <span>SAVED NOTES</span>
          <strong>{progress.notes.length}</strong>
        </div>
        <div>
          <span>YOUR PRACTICE TABLES</span>
          <strong>{progress.setups?.length ?? 0}</strong>
        </div>
      </div>
      <section className="hub-practice">
        <div className="section-title">
          <h2>Choose your practice</h2>
          <Link to="/game-simulator" className="text-link">
            Take a seat
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hub-practice-grid">
          {practice.map((mode, index) => (
            <Link
              className={`hub-practice-item hub-tone-${mode.tone}`}
              key={mode.path}
              to={mode.path}
            >
              <div>
                <span>0{index + 1}</span>
                <ArrowRight size={18} />
              </div>
              <mode.icon size={32} strokeWidth={1.3} />
              <h3>{mode.title}</h3>
              <p>{mode.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="hub-study-layout">
        <section>
          <div className="section-title">
            <h2>Keep your learning moving</h2>
            <Link to="/strategy-library" className="text-link">
              All lessons
              <ArrowRight size={16} />
            </Link>
          </div>
          {next ? (
            <div className="hub-next-lesson">
              <p className="eyebrow">Up next · {next.level}</p>
              <h3>{next.title}</h3>
              <p>{next.description}</p>
              <Link className="button-primary" to={`/study/${next.slug}`}>
                {completed ? "Continue lesson path" : "Start learning"}
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <div className="hub-next-lesson">
              <CheckCircle2 size={28} />
              <h3>Course completed.</h3>
              <p>
                Revisit the concepts that need work or put your knowledge to use
                at the table.
              </p>
              <Link to="/strategy-library" className="text-link">
                Review the course
                <ArrowRight size={17} />
              </Link>
            </div>
          )}
          <div className="hub-tools">
            <Link to="/poker-math">
              <span>Poker math</span>
              <small>EV, draws and sizing</small>
              <ArrowRight size={16} />
            </Link>
            <Link to="/strategy-library?tab=Notebook">
              <span>Your notebook</span>
              <small>Lessons and saved hand reviews</small>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <aside className="hub-concepts">
          <p className="eyebrow">From your practice</p>
          <h2>Concept check-in</h2>
          {conceptData.length ? (
            conceptData.map(([concept, result]) => (
              <div className="concept-check" key={concept}>
                <div>
                  <span>{concept}</span>
                  <strong>
                    {Math.round((result.correct / result.total) * 100)}%
                  </strong>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${(result.correct / result.total) * 100}%`,
                    }}
                  />
                </div>
                <small>
                  {result.correct} correct across {result.total} answered
                  questions
                </small>
              </div>
            ))
          ) : (
            <p className="hub-no-data">
              Your concept results will appear after you complete a quiz or
              review a situation.
            </p>
          )}
          <p className="lab-assumption">
            Progress is saved for this account in this browser.
          </p>
        </aside>
      </div>
      <section className="published-modules">
        <div className="section-title">
          <h2>Published learning modules</h2>
          <span>{modules.length} modules</span>
        </div>
        {loading && (
          <p role="status" className="empty-message">
            Loading published lessons...
          </p>
        )}
        {error && (
          <div className="empty-message" role="alert">
            <p>
              Published modules could not be loaded. The course library and
              practice tools are still available.
            </p>
            <button
              className="quiet-button"
              onClick={() => {
                setError(false);
                setLoading(true);
                setRetry(retry + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && !modules.length && (
          <p className="empty-message">
            No additional modules have been published.
          </p>
        )}
        {modules.map((module) => (
          <details key={module.id}>
            <summary>
              {module.title}
              <span>
                {module.lessons?.length ?? 0} lessons ·{" "}
                {module.quizzes?.length ?? 0} quizzes
              </span>
            </summary>
            <p>{module.description}</p>
            <div>
              {module.lessons?.map((lesson) => (
                <Link to={`/lesson/${lesson.id}`} key={lesson.id}>
                  <span>{lesson.title}</span>
                  {progress.lessons.includes(`api:${lesson.id}`) ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <ArrowRight size={17} />
                  )}
                </Link>
              ))}
              {module.quizzes?.map((quiz) => (
                <Link key={quiz.id} to={`/quiz/${quiz.id}`}>
                  <span>
                    {quiz.title}
                    <small>QUIZ</small>
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          </details>
        ))}
      </section>
    </PageShell>
  );
}
