import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../lib/axios";
import { useProgress, useProgressStore } from "../store/useProgressStore";
import { curriculum } from "../data/curriculum";

interface Lesson {
  id: number;
  title: string;
  content: string;
}
export default function LessonReader() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState<{
    id: string;
    lesson?: Lesson;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  const progress = useProgress();
  const complete = useProgressStore((state) => state.completeLesson);
  useEffect(() => {
    let stale = false;
    api
      .get(`/lessons/${id}`)
      .then(({ data }) => {
        if (!stale) setLoaded({ id: id!, lesson: data });
      })
      .catch(() => {
        if (!stale)
          setLoaded({
            id: id!,
            error: "The lesson could not be loaded. Please try again.",
          });
      });
    return () => {
      stale = true;
    };
  }, [id, retry]);
  const lesson = loaded && loaded.id === id ? loaded.lesson : undefined;
  const error = loaded && loaded.id === id ? loaded.error : undefined;
  const completed = progress.lessons.includes(`api:${id}`);
  const paragraphs =
    lesson?.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean) ?? [];
  const words = lesson?.content.split(/\s+/).length ?? 0;
  const related = curriculum.find((topic) =>
    topic.title
      .toLowerCase()
      .split(/\W+/)
      .some(
        (word) => word.length > 4 && lesson?.title.toLowerCase().includes(word),
      ),
  );
  return (
    <PageShell>
      {lesson ? (
        <>
          <Link className="breadcrumb-link" to="/dashboard">
            <ArrowLeft size={16} />
            Learning hub
          </Link>
          <header className="training-header">
            <div>
              <p className="eyebrow">Published lesson</p>
              <h1>{lesson.title}</h1>
            </div>
            <span className="reading-time">
              <Clock3 size={16} />
              {Math.max(1, Math.ceil(words / 180))} min
            </span>
          </header>
          <div className="lesson-layout">
            <article className="lesson-article">
              {paragraphs.map((paragraph, index) => (
                <section id={`paragraph-${index}`} key={index}>
                  <span className="lesson-section-number">0{index + 1}</span>
                  <p>{paragraph}</p>
                </section>
              ))}
              <footer className="lesson-footer">
                <button
                  className="button-primary"
                  disabled={completed}
                  onClick={() => complete(`api:${id}`)}
                >
                  <CheckCircle2 size={18} />
                  {completed ? "Lesson completed" : "Mark complete"}
                </button>
                <Link to="/strategy-library" className="quiet-button">
                  Continue learning
                  <ArrowRight size={18} />
                </Link>
              </footer>
            </article>
            <aside className="lesson-outline">
              <span>GO DEEPER</span>
              {related && (
                <div className="next-lesson">
                  <Link to={`/study/${related.slug}`}>
                    {related.title}
                    <ArrowRight size={16} />
                  </Link>
                  <Link to={`/practice-quiz/${related.slug}`}>
                    Check your understanding
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
              <div className="next-lesson">
                <Link to="/poker-math">
                  Poker math
                  <ArrowRight size={16} />
                </Link>
                <Link to="/situations">
                  Practice situations
                  <ArrowRight size={16} />
                </Link>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="loading-state" role={error ? "alert" : "status"}>
          <h1>{error ? "Lesson unavailable" : "Loading lesson..."}</h1>
          <p>{error}</p>
          {error && (
            <button
              className="quiet-button"
              onClick={() => {
                setLoaded(undefined);
                setRetry(retry + 1);
              }}
            >
              <RotateCcw size={18} />
              Try again
            </button>
          )}
        </div>
      )}
    </PageShell>
  );
}
