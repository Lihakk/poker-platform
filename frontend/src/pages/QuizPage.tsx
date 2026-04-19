import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    api.get(`/quizzes/${id}`).then((res) => setQuiz(res.data));
  }, [id]);

  if (!quiz) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading Quiz...</div>;

  const handleAnswer = (optionId: number, isCorrect: boolean) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    setIsAnswered(true);
    if (isCorrect) setScore(score + 1);
  };

  const nextQuestion = () => {
    if (currentStep + 1 < quiz.questions.length) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-8">
        <div className="bg-slate-800 p-10 rounded-2xl border border-slate-700 text-center max-w-md w-full">
          <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
          <p className="text-5xl font-extrabold text-blue-400 mb-6">{score} / {quiz.questions.length}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentStep];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex justify-between items-center text-slate-400">
          <span>Question {currentStep + 1} of {quiz.questions.length}</span>
          <span className="text-sm px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            Score: {score}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-8">{currentQuestion.text}</h1>

        <div className="space-y-4">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt.id, opt.is_correct)}
              disabled={isAnswered}
              className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-200 ${
                selectedOption === opt.id
                  ? opt.is_correct ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
                  : 'border-slate-700 bg-slate-800 hover:border-blue-500'
              } ${isAnswered && opt.is_correct ? 'border-green-500 bg-green-900/20' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span>{opt.text}</span>
                {isAnswered && opt.is_correct && <span className="text-green-500">✓</span>}
                {isAnswered && !opt.is_correct && selectedOption === opt.id && <span className="text-red-500">✗</span>}
              </div>
            </button>
          ))}
        </div>

        {isAnswered && (
          <button 
            onClick={nextQuestion}
            className="mt-8 w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition"
          >
            {currentStep + 1 === quiz.questions.length ? "Finish Quiz" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}