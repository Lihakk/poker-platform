import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LessonReader from './pages/LessonReader'
import QuizPage from './pages/QuizPage';; 

// A simple component to protect routes from logged-out users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/quiz/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route 
          path="/lesson/:id" 
          element={
            <ProtectedRoute>
              <LessonReader />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}