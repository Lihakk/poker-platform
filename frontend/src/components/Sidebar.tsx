import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/poker-math', label: 'Poker Math' },
  { to: '/strategy-library', label: 'Strategy Library' },
  { to: '/custom-games', label: 'Custom Games' },
  { to: '/ai-games', label: 'AI Games' },
  { to: '/game-simulator', label: 'Game Simulator' },
  { to: '/situations', label: 'Situations' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed left-0 top-0 flex min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-10 text-2xl font-black tracking-tighter text-white">
        POKER<span className="text-blue-500">LEARN</span>
      </h2>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-3 font-bold transition ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            {user?.username?.[0]?.toUpperCase() ?? 'P'}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{user?.username ?? 'Player'}</p>
            <p className="text-xs text-slate-400">Rank 1 - Pro</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full rounded-lg bg-slate-800 py-2 text-sm font-bold text-red-300 transition hover:bg-red-950">
          Logout
        </button>
      </div>
    </div>
  );
}
