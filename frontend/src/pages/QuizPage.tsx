import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import api from "../lib/axios";
import PageShell from "../components/PageShell";
import QuizRunner from "../components/QuizRunner";
import type { StudyQuestion } from "../data/curriculum";

interface ApiQuiz {
  id: number;
  title: string;
  questions: {
    id: number;
    text: string;
    explanation?: string;
    options: { text: string; is_correct: boolean }[];
  }[];
}
export default function QuizPage() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState<{
    id: string;
    quiz?: ApiQuiz;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let stale = false;
    api
      .get(`/quizzes/${id}`)
      .then(({ data }) => {
        if (!stale) setLoaded({ id: id!, quiz: data });
      })
      .catch(() => {
        if (!stale)
          setLoaded({
            id: id!,
            error: "This quiz could not be loaded. Try again.",
          });
      });
    return () => {
      stale = true;
    };
  }, [id, retry]);
  const quiz = loaded && loaded.id === id ? loaded.quiz : undefined;
  const error = loaded && loaded.id === id ? loaded.error : undefined;
  const questions: StudyQuestion[] =
    quiz?.questions
      .filter((question) =>
        question.options.some((option) => option.is_correct),
      )
      .map((question) => ({
        id: String(question.id),
        text: question.text,
        options: question.options.map((option) => option.text),
        correct: question.options.findIndex((option) => option.is_correct),
        explanation: question.explanation ?? "",
        concept: quiz.title,
      })) ?? [];
  return (
    <PageShell>
      {quiz ? (
        <QuizRunner
          key={id}
          title={quiz.title}
          questions={questions}
          quizKey={`api:${id}`}
        />
      ) : (
        <div className="loading-state" role={error ? "alert" : "status"}>
          <h1>{error ? "Quiz unavailable" : "Loading quiz..."}</h1>
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
