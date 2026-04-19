import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 min-h-screen bg-slate-800 border-r border-slate-700 flex flex-col p-6 fixed left-0 top-0">
      <h2 className="text-2xl font-black text-white mb-10 tracking-tighter italic">
        POKER<span className="text-blue-500">LEARN</span>
      </h2>

      <nav className="flex-1 space-y-4">
        <Link to="/dashboard" className="block text-slate-300 hover:text-white font-medium">Dashboard</Link>
        <Link to="/courses" className="block text-slate-300 hover:text-white font-medium">My Courses</Link>
        <Link to="/stats" className="block text-slate-300 hover:text-white font-medium">Statistics</Link>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{user?.username}</p>
            <p className="text-xs text-slate-400">Rank 1 • Pro</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full py-2 bg-slate-700 text-red-400 rounded-lg hover:bg-red-900/20 transition text-sm font-bold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}