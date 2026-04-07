import { useNavigate } from 'react-router-dom';
import { Clock, Edit2, Star, Trash2, Monitor } from 'lucide-react';
import { FaWindows, FaPlaystation, FaXbox } from 'react-icons/fa6';
import { BsNintendoSwitch } from 'react-icons/bs';
import type { GameSummary, GameStatus } from '../types';

interface GameCardProps {
  game: GameSummary;
  onEdit: (game: GameSummary) => void;
  onDelete: (game: GameSummary) => void;
}

const GENRE_GRADIENTS: Record<string, string> = {
  'Action': 'from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/20',
  'Adventure': 'from-green-500/20 to-teal-500/20 text-teal-300 border-teal-500/20',
  'RPG': 'from-purple-500/20 to-violet-500/20 text-violet-300 border-violet-500/20',
  'Role-playing (RPG)': 'from-purple-500/20 to-violet-500/20 text-violet-300 border-violet-500/20',
  'Strategy': 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/20',
  'Shooter': 'from-orange-500/20 to-red-600/20 text-orange-400 border-red-500/20',
  'Music': 'from-pink-500/20 to-rose-400/20 text-pink-300 border-rose-500/20',
  'Platform': 'from-sky-400/20 to-blue-500/20 text-sky-300 border-sky-400/20',
  'Sports': 'from-yellow-500/20 to-lime-500/20 text-lime-300 border-lime-500/20',
  'Sport': 'from-yellow-500/20 to-lime-500/20 text-lime-300 border-lime-500/20',
  'Horror': 'from-red-900/30 to-rose-700/20 text-rose-300 border-rose-500/20',
  'Simulation': 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/20',
  'Simulator': 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/20',
  'Fighting': 'from-orange-600/20 to-red-600/20 text-red-300 border-red-500/20',
  'Racing': 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/20',
  'Puzzle': 'from-pink-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/20',
  'Indie': 'from-amber-400/20 to-yellow-600/20 text-amber-200 border-amber-400/20',
  'Arcade': 'from-cyan-400/20 to-fuchsia-500/20 text-cyan-200 border-cyan-400/20',
  'Visual Novel': 'from-fuchsia-400/20 to-purple-500/20 text-fuchsia-300 border-purple-400/20',
  'Card & Board Game': 'from-emerald-600/20 to-teal-500/20 text-emerald-300 border-emerald-500/20',
  'Tactical': 'from-indigo-500/20 to-blue-700/20 text-indigo-300 border-indigo-500/20',
  'MOBA': 'from-violet-600/20 to-purple-700/20 text-violet-300 border-violet-500/20',
  'Point-and-click': 'from-cyan-500/20 to-teal-600/20 text-cyan-300 border-teal-500/20',
  'Hack and slash/Beat \'em up': 'from-rose-600/20 to-red-700/20 text-rose-300 border-red-600/20',
  'Real Time Strategy (RTS)': 'from-blue-600/20 to-cyan-700/20 text-blue-200 border-blue-500/20',
  'Turn-based strategy (TBS)': 'from-indigo-600/20 to-violet-700/20 text-indigo-200 border-indigo-500/20',
};

const PLATFORM_COLORS: Record<string, string> = {
  PC: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  PS5: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Switch: 'text-red-400 bg-red-500/10 border-red-500/20',
  Xbox: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const STATUS_STYLES: Record<GameStatus, { label: string; emoji: string; cls: string }> = {
  Backlog: { label: 'Pendiente', emoji: '📋', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  Playing: { label: 'Jugando', emoji: '🎮', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  Completed: { label: 'Completado', emoji: '✅', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
  Platinumed: { label: 'Platinado', emoji: '🏆', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
  Dropped: { label: 'Abandonado', emoji: '❌', cls: 'text-red-300 bg-red-500/10 border-red-500/20' },
};

const DEFAULT_BADGE = 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/20';
const DEFAULT_PLATFORM = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'PC': return <FaWindows size={14} />;
    case 'PS5': return <FaPlaystation size={14} />;
    case 'Switch': return <BsNintendoSwitch size={14} />;
    case 'Xbox': return <FaXbox size={14} />;
    default: return <span className="text-[10px] font-bold uppercase px-0.5">{platform}</span>;
  }
};



export function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[game.status] ?? STATUS_STYLES.Backlog;
  const isPlat = game.status === 'Platinumed';

  return (
    <article className={`glass group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in ${
      isPlat 
        ? 'border-amber-400/60 bg-gradient-to-br from-amber-600/10 via-surface-950/80 to-amber-900/05 shadow-[0_0_30px_rgba(251,191,36,0.1)] ring-1 ring-amber-400/20 hover:border-amber-400 hover:shadow-[0_0_40px_rgba(251,191,36,0.2)]' 
        : 'border-white/5 hover:border-amber-500/30 hover:shadow-amber-500/10'
      }`}>
      {/* Platinum premium shine effect */}
      {isPlat && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-400/5 opacity-40" />
          <div className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-platinum-shine" />
        </div>
      )}
      {/* Top Section: Cover Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-900">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-800 text-surface-400">
            <Monitor size={48} strokeWidth={1} />
          </div>
        )}

        {/* Floating Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold backdrop-blur-md ${statusStyle.cls.replace('bg-', 'bg-').replace('/10', '/40')}`}>
            <span className="leading-none">{statusStyle.emoji}</span>
            {statusStyle.label.toUpperCase()}
          </span>
        </div>

        {/* Genres Badge (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 flex gap-1 flex-wrap w-full pr-4">
          {game.genres && game.genres.slice(0, 3).map((g, idx) => (
            <span key={idx} className={`inline-flex items-center gap-1.5 rounded-lg border bg-surface-950/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${GENRE_GRADIENTS[g] ?? DEFAULT_BADGE}`}>
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Section: Details */}
      <div className="relative flex flex-col p-5 z-10">

        {/* Name & Platform */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={() => navigate(`/game/${game.igdbId}/${encodeURIComponent(game.name)}`)}
              className="font-display text-lg font-bold leading-tight text-white transition-colors group-hover:text-amber-300 cursor-pointer hover:underline"
            >
              {game.name}
            </h3>
            {game.platform && (
              <span className={`shrink-0 rounded p-1.5 flex items-center justify-center ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`} title={game.platform}>
                <PlatformIcon platform={game.platform} />
              </span>
            )}
          </div>
        </div>

        {/* Rating & Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-4 border-y border-white/5 py-3">
          {game.difficultyRating != null && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dificultad</span>
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-amber-400" />
                <span className="text-sm font-bold text-white">{game.difficultyRating}/10</span>
              </div>
            </div>
          )}
          {game.hoursPlayed != null && (
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiempo</span>
              <div className="flex items-center justify-end gap-1.5">
                <Clock size={12} className="text-emerald-400" />
                <span className="text-sm font-bold text-white">{game.hoursPlayed}h</span>
              </div>
            </div>
          )}
        </div>

        {/* Review */}
        {game.review && (
          <div className="mb-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Valoración</span>
            <p className="text-sm italic text-slate-400 line-clamp-2 border-l-2 border-amber-500/30 pl-3">
              "{game.review}"
            </p>
          </div>
        )}

        {/* Trophy Progress */}
        {game.trophyPercentage != null && (
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-slate-500">Trofeos</span>
              <span className="text-amber-400">{game.trophyPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(251,191,36,0.3)] ${isPlat ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-shimmer' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  }`}
                style={{ width: `${game.trophyPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(game)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 transition-all duration-200 hover:bg-amber-500/20 hover:text-amber-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit2 size={14} />
            EDITAR
          </button>
          <button
            onClick={() => onDelete(game)}
            className="flex aspect-square items-center justify-center rounded-xl bg-white/5 px-3 py-2.5 text-slate-300 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:scale-[1.02] active:scale-[0.98]"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
