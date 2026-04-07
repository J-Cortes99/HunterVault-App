import { Sparkles, LogOut, User, Share2, Trophy, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeaderProps {
  onAddGame: () => void;
  onEditProfile: () => void;
}

export function Header({ onAddGame, onEditProfile }: HeaderProps) {
  const { user, logout } = useAuth();

  function handleShareProfile() {
    if (!user) return;
    const url = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('¡Enlace de perfil copiado al portapapeles!');
    }).catch(() => {
      window.open(url, '_blank');
    });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <span className="font-display block text-xl font-bold tracking-tight text-white">
              Hunter
              <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                Vault
              </span>
            </span>
            <span className="text-xs text-slate-500">Rastreador de Trofeos y Logros</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <Link 
              to={`/profile/${user.username}`}
              className="hidden items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 sm:flex hover:bg-white/10 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600/40 to-yellow-600/40">
                <User size={14} className="text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white leading-tight">{user.username}</span>
                {user.role && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    {user.role}
                  </span>
                )}
              </div>
            </Link>
          )}

          {/* Edit Profile */}
          <button
            onClick={onEditProfile}
            title="Editar mi perfil"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 text-slate-400 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
          >
            <Edit3 size={18} />
          </button>

          {/* Share Profile */}
          <button
            onClick={handleShareProfile}
            id="share-profile-button"
            title="Comparte tu perfil"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 text-slate-400 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
          >
            <Share2 size={18} />
          </button>

          {/* Add button */}
          <button
            onClick={onAddGame}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:shadow-amber-500/40 active:scale-95"
          >
            <Sparkles size={16} className="transition-transform duration-200 group-hover:rotate-12" />
            Registrar Hunt
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            id="logout-button"
            title="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 text-slate-400 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
