import { Gamepad2, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onAddGame: () => void;
}

export function Header({ onAddGame }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#080812]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Gamepad2 size={20} className="text-white" />
          </div>
          <div>
            <span className="font-display block text-xl font-bold tracking-tight text-white">
              Game
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Store
              </span>
            </span>
            <span className="text-xs text-slate-500">Catalog Manager</span>
          </div>
        </div>

        {/* Right side: user info + buttons */}
        <div className="flex items-center gap-3">
          {/* User info */}
          {user && (
            <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/40 to-indigo-600/40">
                <User size={14} className="text-violet-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white leading-tight">{user.username}</span>
                {user.role && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Add button */}
          <button
            onClick={onAddGame}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-105 hover:shadow-violet-500/40 active:scale-95"
          >
            <Sparkles size={16} className="transition-transform duration-200 group-hover:rotate-12" />
            Add Game
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            id="logout-button"
            title="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 text-slate-400 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
