import { Plus, LogOut, Share2, Crosshair, Edit3, FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeaderProps {
  onAddGame: () => void;
  onEditProfile: () => void;
}

export function Header({ onAddGame, onEditProfile }: HeaderProps) {
  const { user, logout, isDemo } = useAuth();

  function handleShareProfile() {
    if (!user) return;
    const url = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('PERFIL VINCULADO AL PORTAPAPELES');
    }).catch(() => {
      window.open(url, '_blank');
    });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-signal-400/15 bg-void/80 backdrop-blur-xl">
      {/* Top thin status strip */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-signal-400 to-transparent opacity-60" />
      <div className="relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(0,229,255,0.06) 1px, transparent 1px)',
            backgroundSize: '120px 100%',
          }}
        />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Brand */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="hud-clip-sm relative flex h-11 w-11 items-center justify-center bg-gradient-to-br from-signal-400 to-signal-600 glow-signal">
              <Crosshair size={20} className="text-void" strokeWidth={2.5} />
              <div className="absolute inset-0 hud-clip-sm border border-signal-200/60" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-bold tracking-tight text-white">
                HUNTER<span className="text-signal-400 text-glow-signal">/</span><span className="bg-gradient-to-r from-power-300 to-power-500 bg-clip-text text-transparent">VAULT</span>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-hud text-signal-400/70">
                <span className="animate-data-blink">●</span> NEURAL_HUNT_TERMINAL · v2.7
              </div>
            </div>

            {isDemo && (
              <span
                title="Modo demo · datos de ejemplo · cambios efímeros"
                className="hud-clip-tag ml-3 hidden items-center gap-1.5 border border-power-300/50 bg-power-400/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-hud text-power-200 sm:inline-flex"
              >
                <FlaskConical size={11} />
                DEMO_MODE
              </span>
            )}
          </Link>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {user && (
              <Link
                to={`/profile/${user.username}`}
                className="hud-clip-sm hidden items-center gap-2.5 border border-signal-400/20 bg-signal-400/5 px-3 py-2 transition-all hover:border-signal-400/50 hover:bg-signal-400/10 sm:flex"
              >
                <div className="hud-clip-sm flex h-7 w-7 items-center justify-center bg-gradient-to-br from-signal-500/40 to-power-500/40 border border-signal-300/40">
                  <span className="font-display text-xs font-bold text-white">
                    {user.username[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-xs font-semibold text-white tracking-wide">{user.username}</span>
                  <span className="font-mono text-[9px] tracking-hud text-signal-400/80">
                    HUNTER_PROFILE
                  </span>
                </div>
              </Link>
            )}

            <button
              onClick={onEditProfile}
              title="Editar perfil"
              className="hud-clip-sm flex h-10 w-10 items-center justify-center border border-signal-400/15 bg-signal-400/[0.03] text-slate-400 transition-all hover:border-signal-400/50 hover:bg-signal-400/10 hover:text-signal-300"
            >
              <Edit3 size={16} />
            </button>

            <button
              onClick={handleShareProfile}
              id="share-profile-button"
              title="Compartir perfil"
              className="hud-clip-sm flex h-10 w-10 items-center justify-center border border-signal-400/15 bg-signal-400/[0.03] text-slate-400 transition-all hover:border-signal-400/50 hover:bg-signal-400/10 hover:text-signal-300"
            >
              <Share2 size={16} />
            </button>

            <button
              onClick={onAddGame}
              className="hud-clip-sm hud-cta hud-cta-power group flex items-center gap-2 px-5 py-2.5 text-xs"
            >
              <Plus size={14} strokeWidth={3} className="transition-transform duration-200 group-hover:rotate-90" />
              REGISTRAR HUNT
            </button>

            <button
              onClick={logout}
              id="logout-button"
              title="Cerrar sesión"
              className="hud-clip-sm flex h-10 w-10 items-center justify-center border border-alert-400/15 bg-alert-500/[0.03] text-slate-400 transition-all hover:border-alert-400/50 hover:bg-alert-500/15 hover:text-alert-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
