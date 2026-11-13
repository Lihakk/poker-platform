import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import api from "./lib/axios";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LessonReader = lazy(() => import("./pages/LessonReader"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const CustomGames = lazy(() => import("./pages/CustomGames"));
const AiGames = lazy(() => import("./pages/AiGames"));
const Situations = lazy(() => import("./pages/Situations"));
const PokerMath = lazy(() => import("./pages/PokerMath"));
const StrategyLibrary = lazy(() => import("./pages/StrategyLibrary"));
const GameSimulator = lazy(() => import("./pages/GameSimulator"));
const ContentEditor = lazy(() => import("./pages/ContentEditor"));
const StudyLesson = lazy(() => import("./pages/StudyLesson"));
const StudyQuiz = lazy(() => import("./pages/StudyQuiz"));
const EquityLab = lazy(() => import("./pages/EquityLab"));
let restorePromise: Promise<void> | null = null;

// A simple component to protect routes from logged-out users
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const ready = useAuthStore((state) => state.ready);
  if (!ready) return <RouteFallback />;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-white">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          PokerLearn
        </p>
        <p className="mt-3 text-2xl font-black">Loading trainer...</p>
      </div>
    </div>
  );
}

function ResetScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    restorePromise ??= api
      .post("/refresh")
      .then(({ data }) => useAuthStore.getState().login(data.token, data.user))
      .catch(() => useAuthStore.getState().finishRestore());
  }, []);
  return (
    <BrowserRouter>
      <ResetScroll />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<LandingPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:id"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/custom-games"
            element={
              <ProtectedRoute>
                <CustomGames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-games"
            element={
              <ProtectedRoute>
                <AiGames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game-simulator"
            element={
              <ProtectedRoute>
                <GameSimulator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/situations"
            element={
              <ProtectedRoute>
                <Situations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/poker-math"
            element={
              <ProtectedRoute>
                <PokerMath />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equity-lab"
            element={
              <ProtectedRoute>
                <EquityLab />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategy-library"
            element={
              <ProtectedRoute>
                <StrategyLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study/:slug"
            element={
              <ProtectedRoute>
                <StudyLesson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice-quiz/:slug"
            element={
              <ProtectedRoute>
                <StudyQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-editor"
            element={
              <ProtectedRoute>
                <ContentEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:id"
            element={
              <ProtectedRoute>
                <LessonReader />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
