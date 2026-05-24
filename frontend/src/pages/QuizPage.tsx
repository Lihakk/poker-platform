import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../lib/axios';

interface Option {
  id: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface Quiz {
  id: number;
  title: string;
  questions: Question[];
}

const buildExplanation = (question: Question, selectedOption: Option | undefined) => {
  const correctOption = question.options.find((option) => option.is_correct);
  if (!selectedOption || !correctOption) return 'Choose an answer to see the coaching note.';

  if (selectedOption.is_correct) {
    return `Correct. ${correctOption.text} is the best answer for this concept.`;
  }

  return `Not quite. The best answer is "${correctOption.text}". Compare it against your answer and ask which poker concept the question is testing.`;
};

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [answers, setAnswers] = useState<Array<{ question: string; selected: string; correct: string; wasCorrect: boolean }>>([]);

  useEffect(() => {
    api.get(`/quizzes/${id}`).then((res) => setQuiz(res.data));
  }, [id]);

  const currentQuestion = quiz?.questions[currentStep];
  const progress = quiz ? ((currentStep + (selectedOption ? 1 : 0)) / Math.max(quiz.questions.length, 1)) * 100 : 0;
  const explanation = useMemo(
    () => (currentQuestion ? buildExplanation(currentQuestion, selectedOption ?? undefined) : ''),
    [currentQuestion, selectedOption],
  );

  if (!quiz) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="ml-64 w-full p-10">Loading quiz...</main>
      </div>
    );
  }

  const handleAnswer = (option: Option) => {
    if (selectedOption || !currentQuestion) return;
    const correctOption = currentQuestion.options.find((item) => item.is_correct);

    setSelectedOption(option);
    if (option.is_correct) setScore((currentScore) => currentScore + 1);
    setAnswers((currentAnswers) => [
      ...currentAnswers,
      {
        question: currentQuestion.text,
        selected: option.text,
        correct: correctOption?.text ?? '',
        wasCorrect: option.is_correct,
      },
    ]);
  };

  const nextQuestion = () => {
    if (currentStep + 1 < quiz.questions.length) {
      setCurrentStep((step) => step + 1);
      setSelectedOption(null);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    const percentage = Math.round((score / Math.max(quiz.questions.length, 1)) * 100);

    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="ml-64 w-full p-10">
          <div className="mx-auto max-w-4xl rounded-lg border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">Quiz complete</p>
            <h1 className="mt-2 text-4xl font-black">{quiz.title}</h1>
            <p className="mt-4 text-6xl font-black text-indigo-300">{percentage}%</p>
            <p className="mt-2 text-slate-400">
              Score: {score} / {quiz.questions.length}
            </p>

            <div className="mt-8 space-y-3">
              {answers.map((answer) => (
                <article key={answer.question} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <p className="font-bold text-slate-100">{answer.question}</p>
                  <p className={`mt-2 text-sm ${answer.wasCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Your answer: {answer.selected}
                  </p>
                  {!answer.wasCorrect && <p className="mt-1 text-sm text-slate-400">Correct answer: {answer.correct}</p>}
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500">
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setScore(0);
                  setShowResults(false);
                  setSelectedOption(null);
                  setAnswers([]);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-3 font-bold text-slate-100 hover:border-indigo-300"
              >
                Retry Quiz
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="ml-64 w-full p-10">This quiz has no questions yet.</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="ml-64 w-full p-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
              <span>
                Question {currentStep + 1} of {quiz.questions.length}
              </span>
              <span>Score: {score}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">{quiz.title}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">{currentQuestion.text}</h1>

            <div className="mt-8 space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedOption !== null}
                  className={`w-full rounded-lg border p-5 text-left font-bold transition ${
                    selectedOption?.id === option.id
                      ? option.is_correct
                        ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                        : 'border-rose-400 bg-rose-500/15 text-rose-100'
                      : selectedOption && option.is_correct
                        ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                        : 'border-slate-700 bg-slate-950 text-slate-100 hover:border-indigo-400'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>

            {selectedOption && (
              <div className="mt-6 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-5">
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-200">Coach note</p>
                <p className="mt-2 text-slate-200">{explanation}</p>
              </div>
            )}

            {selectedOption && (
              <button onClick={nextQuestion} className="mt-6 w-full rounded-lg bg-indigo-600 px-5 py-4 font-black text-white hover:bg-indigo-500">
                {currentStep + 1 === quiz.questions.length ? 'Finish Quiz' : 'Next Question'}
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
