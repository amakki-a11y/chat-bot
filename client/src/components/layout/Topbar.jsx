import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Topbar({ onMenuToggle }) {
  const { tenant, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-slate-400 hover:text-slate-100">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold">
          Support <span className="text-indigo-400">Hub</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-slate-300">{tenant?.name}</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-400">
            {tenant?.plan}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
