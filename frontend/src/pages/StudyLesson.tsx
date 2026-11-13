import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import PageShell from "../components/PageShell";
import PlayingCard from "../components/PlayingCard";
import { curriculum, type StudyTopic } from "../data/curriculum";
import { useProgress, useProgressStore } from "../store/useProgressStore";

export default function StudyLesson() {
  const { slug } = useParams();
  const topic = curriculum.find((item) => item.slug === slug);
  return (
    <PageShell>
      {topic ? (
        <Lesson topic={topic} key={topic.slug} />
      ) : (
        <div className="loading-state">
          <h1>Topic not found</h1>
          <Link to="/strategy-library" className="text-link">
            Back to library
          </Link>
        </div>
      )}
    </PageShell>
  );
}
function Lesson({ topic }: { topic: StudyTopic }) {
  const progress = useProgress();
  const complete = useProgressStore((state) => state.completeLesson);
  const saveNote = useProgressStore((state) => state.saveNote);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const completed = progress.lessons.includes(topic.slug);
  const next = curriculum[curriculum.indexOf(topic) + 1];
  return (
    <>
      <Link to="/strategy-library" className="breadcrumb-link">
        <ArrowLeft size={16} />
        Study library
      </Link>
      <header className="training-header">
        <div>
          <p className="eyebrow">{topic.level} / Course lesson</p>
          <h1>{topic.title}</h1>
          <p>{topic.description}</p>
        </div>
        <span className="reading-time">
          <Clock3 size={16} />
          {topic.minutes} min{completed && <CheckCircle2 size={18} />}
        </span>
      </header>
      <div className="lesson-layout">
        <article className="lesson-article">
          <div className="lesson-takeaway">
            <span>THE CORE IDEA</span>
            <p>{topic.takeaway}</p>
          </div>
          {topic.sections.map((section, i) => (
            <section id={`section-${i}`} key={section.title}>
              <span className="lesson-section-number">0{i + 1}</span>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <section className="worked-example" id="worked-example">
            <p className="eyebrow">Worked example</p>
            <h2>{topic.example.title}</h2>
            {(topic.example.hand || topic.example.board) && (
              <div className="example-cards">
                {topic.example.hand && (
                  <div>
                    <span>HAND</span>
                    <div>
                      {topic.example.hand.match(/.{2}/g)?.map((code) => (
                        <PlayingCard small code={code} key={code} />
                      ))}
                    </div>
                  </div>
                )}
                {topic.example.board && (
                  <div>
                    <span>BOARD</span>
                    <div>
                      {topic.example.board.match(/.{2}/g)?.map((code) => (
                        <PlayingCard small code={code} key={code} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <ol>
              {topic.example.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          <section id="common-traps">
            <h2>Common traps</h2>
            <ul className="lesson-traps">
              {topic.traps.map((trap) => (
                <li key={trap}>{trap}</li>
              ))}
            </ul>
          </section>
          <section className="lesson-note">
            <h2>Your takeaway</h2>
            <textarea
              aria-label="Lesson notes"
              placeholder="What will you change in your next hand?"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setSaved(false);
              }}
              rows={3}
              maxLength={3000}
            />
            <button
              className="quiet-button"
              disabled={!note.trim() || saved}
              onClick={() => {
                saveNote(topic.title, note.trim());
                setSaved(true);
              }}
            >
              <BookmarkPlus size={18} />
              {saved ? "Saved to notebook" : "Save note"}
            </button>
          </section>
          <footer className="lesson-footer">
            <button
              className="button-primary"
              disabled={completed}
              onClick={() => complete(topic.slug)}
            >
              <CheckCircle2 size={18} />
              {completed ? "Lesson completed" : "Mark complete"}
            </button>
            <Link className="quiet-button" to={`/practice-quiz/${topic.slug}`}>
              Check your understanding
              <ArrowRight size={18} />
            </Link>
          </footer>
        </article>
        <aside className="lesson-outline">
          <span>IN THIS LESSON</span>
          <nav aria-label="Lesson sections">
            {topic.sections.map((section, i) => (
              <a href={`#section-${i}`} key={section.title}>
                <small>0{i + 1}</small>
                {section.title}
              </a>
            ))}
            <a href="#worked-example">Worked example</a>
            <a href="#common-traps">Common traps</a>
          </nav>
          <Link className="quiet-button" to={topic.practice}>
            Practice this concept
            <ArrowRight size={16} />
          </Link>
          {next && (
            <div className="next-lesson">
              <span>UP NEXT</span>
              <Link to={`/study/${next.slug}`}>
                {next.title}
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
