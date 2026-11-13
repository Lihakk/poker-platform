import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Search,
  Trash2,
  NotebookPen,
} from "lucide-react";
import PageShell from "../components/PageShell";
import { curriculum, studySources } from "../data/curriculum";
import { glossaryTerms } from "../data/pokerTheory";
import { useProgress, useProgressStore } from "../store/useProgressStore";

export default function StrategyLibrary() {
  const location = useLocation();
  const initialTab =
    new URLSearchParams(location.search).get("tab") ?? "Courses";
  const [tab, setTab] = useState(
    ["Courses", "Glossary", "Notebook"].includes(initialTab)
      ? initialTab
      : "Courses",
  );
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const progress = useProgress();
  const removeNote = useProgressStore((state) => state.removeNote);
  const topics = curriculum.filter(
    (topic) =>
      (level === "All levels" || topic.level === level) &&
      `${topic.title} ${topic.description} ${topic.takeaway}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const terms = glossaryTerms.filter((term) =>
    `${term.term} ${term.category} ${term.definition}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const notes = progress.notes.filter((note) =>
    `${note.title} ${note.text}`.toLowerCase().includes(query.toLowerCase()),
  );
  const completed = curriculum.filter((topic) =>
    progress.lessons.includes(topic.slug),
  ).length;
  const next = curriculum.find(
    (topic) => !progress.lessons.includes(topic.slug),
  );
  const weaknesses = Object.entries(progress.concepts)
    .filter(
      ([, value]) => value.total >= 2 && value.correct / value.total < 0.7,
    )
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 3);

  return (
    <PageShell>
      <header className="training-header">
        <div>
          <p className="eyebrow">Study / Your learning path</p>
          <h1>
            A little knowledge.
            <br />
            <em>A better next hand.</em>
          </h1>
          <p>
            Start with the fundamentals. Build toward the decisions that cost
            the most.
          </p>
        </div>
        <div className="study-progress">
          <BookOpen size={24} />
          <strong>
            {completed}
            <small> / {curriculum.length}</small>
          </strong>
          <span>lessons completed</span>
          <div className="progress-track">
            <span
              style={{ width: `${(completed / curriculum.length) * 100}%` }}
            />
          </div>
        </div>
      </header>
      <div className="study-toolbar">
        <div
          role="tablist"
          aria-label="Library views"
          className="segmented-tabs"
        >
          {["Courses", "Glossary", "Notebook"].map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              onClick={() => {
                setTab(item);
                setQuery("");
              }}
              className={tab === item ? "active" : ""}
            >
              {item}
              {item === "Notebook" && progress.notes.length > 0 && (
                <small>{progress.notes.length}</small>
              )}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            placeholder={
              tab === "Courses"
                ? "Search topics..."
                : tab === "Glossary"
                  ? "Find a term..."
                  : "Search your notes..."
            }
            aria-label="Search library"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {tab === "Courses" && (
          <select
            aria-label="Difficulty level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          >
            {["All levels", "Foundation", "Intermediate", "Advanced"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        )}
      </div>
      <div role="tabpanel" aria-label={tab}>
        {tab === "Courses" && (
          <>
            {!query && level === "All levels" && next && (
              <div className="continue-study">
                <span className="continue-study-number">
                  {String(curriculum.indexOf(next) + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="eyebrow">Your next lesson</p>
                  <h2>{next.title}</h2>
                  <p>{next.description}</p>
                </div>
                <Link to={`/study/${next.slug}`} className="button-primary">
                  {completed ? "Continue learning" : "Start learning"}
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div className="study-focus">
                <span>Worth another look</span>
                {weaknesses.map(([concept, value]) => (
                  <span key={concept}>
                    {concept} ·{" "}
                    {Math.round((value.correct / value.total) * 100)}%
                  </span>
                ))}
              </div>
            )}
            <div className="course-list">
              {topics.map((topic) => {
                const result = progress.quizzes[`study:${topic.slug}`];
                return (
                  <article className="course-row" key={topic.slug}>
                    <div className="course-number">
                      {progress.lessons.includes(topic.slug) ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        String(curriculum.indexOf(topic) + 1).padStart(2, "0")
                      )}
                    </div>
                    <div>
                      <span
                        className={`level-label level-${topic.level.toLowerCase()}`}
                      >
                        {topic.level}
                      </span>
                      <h2>
                        <Link to={`/study/${topic.slug}`}>{topic.title}</Link>
                      </h2>
                      <p>{topic.description}</p>
                      <span className="course-meta">
                        <Clock3 size={13} />
                        {topic.minutes} min · {topic.questions.length} questions
                        {result &&
                          ` · Last score ${Math.round((result.score / result.total) * 100)}%`}
                      </span>
                    </div>
                    <div className="course-actions">
                      <Link to={`/study/${topic.slug}`} className="text-link">
                        Read lesson
                        <ArrowRight size={16} />
                      </Link>
                      <Link to={`/practice-quiz/${topic.slug}`}>Take quiz</Link>
                    </div>
                  </article>
                );
              })}
            </div>
            {topics.length === 0 && (
              <p className="empty-message">No topics match this search.</p>
            )}
            <section className="study-references">
              <h2>Further reading</h2>
              {studySources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title}
                  <ArrowRight size={16} />
                </a>
              ))}
            </section>
          </>
        )}
        {tab === "Glossary" && (
          <div className="glossary-list">
            {terms.map((term) => (
              <article key={term.term}>
                <span className="level-label">{term.category}</span>
                <h2>{term.term}</h2>
                <p>{term.definition}</p>
                <blockquote>{term.example}</blockquote>
              </article>
            ))}
            {terms.length === 0 && (
              <p className="empty-message">No terms match this search.</p>
            )}
          </div>
        )}
        {tab === "Notebook" && (
          <section className="notebook-list">
            {notes.length === 0 && (
              <div className="empty-message">
                <NotebookPen size={32} />
                <h2>Your study notes live here.</h2>
                <p>
                  Save a takeaway from a lesson or a completed hand from the
                  simulator.
                </p>
                <Link to="/game-simulator" className="text-link">
                  Go to the table
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
            {notes.map((note) => (
              <article key={note.id}>
                <div>
                  <span>{new Date(note.date).toLocaleDateString()}</span>
                  <button
                    className="icon-button"
                    title="Delete note"
                    aria-label={`Delete note: ${note.title}`}
                    onClick={() => removeNote(note.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h2>{note.title}</h2>
                <p>{note.text}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </PageShell>
  );
}
