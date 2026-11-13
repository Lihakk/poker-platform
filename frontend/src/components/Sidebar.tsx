import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Calculator,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Settings2,
  Spade,
  Target,
  X,
  BrainCircuit,
  FlaskConical,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import api from "../lib/axios";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [{ to: "/dashboard", label: "Learning hub", icon: LayoutDashboard }],
  },
  {
    label: "STUDY",
    items: [
      { to: "/strategy-library", label: "Study library", icon: BookOpen },
      { to: "/poker-math", label: "Poker math", icon: Calculator },
      { to: "/equity-lab", label: "Equity lab", icon: FlaskConical },
      { to: "/situations", label: "Situations", icon: Target },
    ],
  },
  {
    label: "PLAY",
    items: [
      { to: "/custom-games", label: "Custom games", icon: Settings2 },
      { to: "/ai-games", label: "AI games", icon: BrainCircuit },
      { to: "/game-simulator", label: "Game simulator", icon: Spade },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      panel.current?.querySelectorAll<HTMLElement>("a, button");
    controls()?.[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab") return;
      const items = controls();
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      /* local session still ends */
    }
    logout();
    navigate("/login");
  };

  const contents = (
    <>
      <div className="sidebar-top">
        <NavLink
          to="/dashboard"
          onClick={() => setMenuOpen(false)}
          className="sidebar-wordmark"
        >
          <span className="sidebar-spade">♠</span> POKER<span>LEARN</span>
        </NavLink>
        <p>THE TRAINING ROOM</p>
      </div>
      <nav className="sidebar-nav" aria-label="Training navigation">
        {navGroups.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <p className="sidebar-label">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                <span className="sidebar-icon" aria-hidden="true">
                  <item.icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
        {(user?.role === "editor" || user?.role === "admin") && (
          <div className="sidebar-group">
            <p className="sidebar-label">MANAGE</p>
            <NavLink
              to="/content-editor"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <span className="sidebar-icon" aria-hidden="true">
                <Pencil size={18} />
              </span>
              <span>Content editor</span>
            </NavLink>
          </div>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-account">
          <div className="sidebar-avatar">
            {user?.username?.[0]?.toUpperCase() ?? "P"}
          </div>
          <div>
            <strong>{user?.username ?? "Player"}</strong>
            <small>
              {user?.role === "admin"
                ? "Administrator"
                : user?.role === "editor"
                  ? "Editor"
                  : "Learner"}
            </small>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          Log out <LogOut size={16} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="mobile-app-header">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="mobile-menu-button"
          aria-expanded={menuOpen}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <NavLink to="/dashboard" className="sidebar-wordmark">
          <span className="sidebar-spade">♠</span> POKER<span>LEARN</span>
        </NavLink>
        <div className="sidebar-avatar">
          {user?.username?.[0]?.toUpperCase() ?? "P"}
        </div>
      </header>
      <aside className="app-sidebar">{contents}</aside>
      {menuOpen && (
        <div className="mobile-nav-layer">
          <button
            className="mobile-nav-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            tabIndex={-1}
          />
          <aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Training navigation"
            className="mobile-nav-panel"
          >
            <button
              className="mobile-nav-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
            {contents}
          </aside>
        </div>
      )}
    </>
  );
}
