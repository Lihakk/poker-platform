import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Spade,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import api from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function AuthForm({ register = false }: { register?: boolean }) {
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(() =>
    typeof location.state?.email === "string" ? location.state.email : "",
  );
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await api.post(
        register ? "/register" : "/login",
        register
          ? { username: username.trim(), email: email.trim(), password }
          : { email: email.trim(), password },
      );
      if (register) {
        setCreated(true);
        setPassword("");
      } else {
        login(response.data.token, response.data.user);
        navigate("/dashboard");
      }
    } catch (failure) {
      setError(
        axios.isAxiosError(failure)
          ? failure.response?.data?.error ||
              "Unable to connect. Please try again."
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <header className="auth-topbar">
        <Link to="/" className="auth-brand">
          <Spade size={22} fill="currentColor" /> PokerLearn
        </Link>
        <Link to="/" className="text-link">
          <ArrowLeft size={16} /> Back home
        </Link>
      </header>
      <section className="auth-form-surface">
        <p className="eyebrow">
          {register ? "A seat at the table" : "Your training room"}
        </p>
        <h1>
          {created
            ? "You're in."
            : register
              ? "Start learning."
              : "Welcome back."}
        </h1>
        <p className="auth-intro">
          {created
            ? "Your account is ready. Sign in to begin."
            : register
              ? "Build your understanding, one decision at a time."
              : "Continue your study and get back to the table."}
        </p>
        {created ? (
          <div className="auth-confirmation" role="status">
            <CheckCircle2 size={28} />
            <Link to="/login" state={{ email }} className="button-primary">
              Sign in <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="training-error" role="alert">
                {error}
              </p>
            )}
            <form onSubmit={submit} aria-busy={busy}>
              {register && (
                <label htmlFor="auth-username">
                  Username
                  <Input
                    id="auth-username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    disabled={busy}
                  />
                </label>
              )}
              <label htmlFor="auth-email">
                Email address
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete={register ? "email" : "username"}
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={busy}
                />
              </label>
              <label htmlFor="auth-password">
                Password
                {register && (
                  <small id="password-guidance">At least 8 characters</small>
                )}
                <div className="auth-password">
                  <Input
                    id="auth-password"
                    aria-label="Password"
                    aria-describedby={
                      register ? "password-guidance" : undefined
                    }
                    type={visible ? "text" : "password"}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={register ? 8 : undefined}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={visible ? "Hide password" : "Show password"}
                    title={visible ? "Hide password" : "Show password"}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <Button type="submit" className="button-primary" disabled={busy}>
                {busy
                  ? register
                    ? "Creating account..."
                    : "Signing in..."
                  : register
                    ? "Create account"
                    : "Sign in"}
                <ArrowRight size={18} />
              </Button>
            </form>
            <p className="auth-alternative">
              {register ? "Already have an account?" : "New to PokerLearn?"}{" "}
              <Link to={register ? "/login" : "/register"}>
                {register ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </>
        )}
      </section>
      <footer className="auth-footer">
        PokerLearn / Study. Practice. Review.
      </footer>
    </main>
  );
}
