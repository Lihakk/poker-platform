import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  X,
  BookOpen,
} from "lucide-react";
import type { StudyQuestion } from "../data/curriculum";
import { useProgressStore } from "../store/useProgressStore";

interface Answer {
  question: StudyQuestion;
  choice: number;
  correct: boolean;
}
const shuffle = (items: number[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default function QuizRunner({
  title,
  questions,
  quizKey,
  studyLink = "/strategy-library",
}: {
  title: string;
  questions: StudyQuestion[];
  quizKey: string;
  studyLink?: string;
}) {
  const [queue, setQueue] = useState(questions);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [orders, setOrders] = useState(() =>
    questions.map((question) => shuffle(question.options.map((_, i) => i))),
  );
  const recordConcept = useProgressStore((state) => state.recordConcept);
  const saveQuiz = useProgressStore((state) => state.saveQuiz);
  const current = queue[index];
  const correct = answers.filter((answer) => answer.correct).length;
  const mistakes = answers.filter((answer) => !answer.correct);

  function submit() {
    if (choice === null || submitted) return;
    const isCorrect = choice === current.correct;
    setAnswers((previous) => [
      ...previous,
      { question: current, choice, correct: isCorrect },
    ]);
    setSubmitted(true);
    recordConcept(current.concept, isCorrect);
  }
  function next() {
    if (index + 1 === queue.length) {
      setFinished(true);
      saveQuiz(
        reviewing ? `${quizKey}:review` : quizKey,
        correct,
        queue.length,
      );
    } else {
      setIndex(index + 1);
      setChoice(null);
      setSubmitted(false);
    }
  }
  function restart(onlyMistakes: boolean) {
    const nextQueue = onlyMistakes
      ? mistakes.map((answer) => answer.question)
      : questions;
    setQueue(nextQueue);
    setOrders(
      nextQueue.map((question) => shuffle(question.options.map((_, i) => i))),
    );
    setIndex(0);
    setChoice(null);
    setSubmitted(false);
    setAnswers([]);
    setFinished(false);
    setReviewing(onlyMistakes);
  }
  if (!questions.length)
    return (
      <div className="loading-state">
        <h1>{title}</h1>
        <p>No questions have been published yet.</p>
        <Link to={studyLink} className="text-link">
          Back to study
        </Link>
      </div>
    );

  return (
    <div className="quiz-experience">
      <header className="training-header">
        <div>
          <p className="eyebrow">
            {reviewing ? "Focused review" : "Knowledge check"}
          </p>
          <h1>{title}</h1>
          <p>
            {finished
              ? "Turn the result into your next study session."
              : `${queue.length} questions · Take a moment to reason through each answer.`}
          </p>
        </div>
        <Link className="quiet-button" to={studyLink}>
          <BookOpen size={18} />
          Study topic
        </Link>
      </header>
      {finished ? (
        <>
          <section className="quiz-outcome">
            <div className="quiz-score-circle">
              <strong>
                {Math.round((correct / queue.length) * 100)}
                <small>%</small>
              </strong>
              <span>
                {correct} / {queue.length}
              </span>
            </div>
            <div>
              <p className="eyebrow">
                {mistakes.length ? "Keep building" : "Well understood"}
              </p>
              <h2>
                {mistakes.length
                  ? "A clear next step."
                  : "The reasoning is clicking."}
              </h2>
              <p>
                {mistakes.length
                  ? `${mistakes.length} ${mistakes.length === 1 ? "question needs" : "questions need"} another look. Review the explanations below, then try those concepts again.`
                  : "All answers were correct. Put the concepts to work in a live practice hand."}
              </p>
              <div className="result-actions">
                {mistakes.length > 0 && (
                  <button
                    className="button-primary"
                    onClick={() => restart(true)}
                  >
                    Retry mistakes
                    <RotateCcw size={18} />
                  </button>
                )}
                <button className="quiet-button" onClick={() => restart(false)}>
                  <RotateCcw size={18} />
                  Retry all
                </button>
                <Link className="quiet-button" to="/game-simulator">
                  Practice a hand
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </section>
          <section className="quiz-answer-review">
            <h2>Your answer review</h2>
            {answers.map((answer, i) => (
              <details key={answer.question.id} open={!answer.correct}>
                <summary>
                  {answer.correct ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <X size={18} />
                  )}
                  <span>
                    {i + 1}. {answer.question.text}
                  </span>
                  <small>{answer.correct ? "Correct" : "Review"}</small>
                </summary>
                <div>
                  <p>
                    Your answer:{" "}
                    <strong>{answer.question.options[answer.choice]}</strong>
                  </p>
                  {!answer.correct && (
                    <p>
                      Correct answer:{" "}
                      <strong>
                        {answer.question.options[answer.question.correct]}
                      </strong>
                    </p>
                  )}
                  <p>
                    {answer.question.explanation ||
                      "Review this question with the related lesson before trying again."}
                  </p>
                </div>
              </details>
            ))}
          </section>
        </>
      ) : (
        <section className="question-workspace">
          <div className="question-progress">
            <span>
              QUESTION {index + 1} OF {queue.length}
            </span>
            <span>{current.concept}</span>
          </div>
          <div className="progress-track">
            <span
              style={{ width: `${(answers.length / queue.length) * 100}%` }}
            />
          </div>
          <h2>{current.text}</h2>
          <div className="quiz-options">
            {orders[index].map((option, i) => (
              <button
                key={option}
                className={`quiz-option${choice === option ? " selected" : ""}${submitted && option === current.correct ? " correct" : ""}${submitted && choice === option && option !== current.correct ? " wrong" : ""}`}
                disabled={submitted}
                onClick={() => setChoice(option)}
                aria-pressed={choice === option}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{current.options[option]}</span>
                {submitted && option === current.correct ? (
                  <Check size={20} />
                ) : submitted && choice === option ? (
                  <X size={20} />
                ) : (
                  <span className="option-radio" />
                )}
              </button>
            ))}
          </div>
          {submitted && (
            <div
              className={`quiz-feedback ${choice === current.correct ? "is-correct" : ""}`}
              aria-live="polite"
            >
              <strong>
                {choice === current.correct
                  ? "That’s right."
                  : "Let’s unpack that."}
              </strong>
              <p>
                {current.explanation ||
                  `The correct answer is “${current.options[current.correct]}”. Revisit the related lesson for the reasoning behind it.`}
              </p>
            </div>
          )}
          <footer className="question-footer">
            <span>
              {submitted ? `${correct} correct so far` : "Choose one answer"}
            </span>
            {submitted ? (
              <button className="button-primary" onClick={next}>
                {index + 1 === queue.length ? "See results" : "Next question"}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className="button-primary"
                onClick={submit}
                disabled={choice === null}
              >
                Check answer
                <Check size={18} />
              </button>
            )}
          </footer>
        </section>
      )}
    </div>
  );
}
