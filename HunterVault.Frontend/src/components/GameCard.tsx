import { Calendar, Clock, Edit2, Star, Tag, Trash2, Monitor, Disc, Wifi } from 'lucide-react';
import type { GameSummary, GameStatus } from '../types';
import { GAME_STATUSES } from '../types';

interface GameCardProps {
  game: GameSummary;
  onEdit: (game: GameSummary) => void;
  onDelete: (game: GameSummary) => void;
}

const GENRE_GRADIENTS: Record<string, string> = {
  Action:       'from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/20',
  Adventure:    'from-green-500/20 to-teal-500/20 text-teal-300 border-teal-500/20',
  RPG:          'from-purple-500/20 to-violet-500/20 text-violet-300 border-violet-500/20',
  Strategy:     'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/20',
  Sports:       'from-yellow-500/20 to-lime-500/20 text-lime-300 border-lime-500/20',
  Horror:       'from-red-900/30 to-rose-700/20 text-rose-300 border-rose-500/20',
  Simulation:   'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/20',
  Fighting:     'from-orange-600/20 to-red-600/20 text-red-300 border-red-500/20',
  Racing:       'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/20',
  Puzzle:       'from-pink-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/20',
};

const PLATFORM_COLORS: Record<string, string> = {
  PC:     'text-sky-400 bg-sky-500/10 border-sky-500/20',
  PS5:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Switch: 'text-red-400 bg-red-500/10 border-red-500/20',
  Retro:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const STATUS_STYLES: Record<GameStatus, { label: string; emoji: string; cls: string }> = {
  Backlog:    { label: 'Pendiente',   emoji: '📋', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  Playing:    { label: 'Jugando',     emoji: '🎮', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  Completed:  { label: 'Completado',  emoji: '✅', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
  Platinumed: { label: 'Platinado',   emoji: '🏆', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
  Dropped:    { label: 'Abandonado',  emoji: '❌', cls: 'text-red-300 bg-red-500/10 border-red-500/20' },
};

const DEFAULT_BADGE   = 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/20';
const DEFAULT_PLATFORM = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

function formatDate(raw: string) {
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function RatingDots({ rating }: { rating: number }) {
  const color =
    rating <= 4 ? 'bg-emerald-400' :
    rating <= 7 ? 'bg-amber-400' :
    'bg-red-400';

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full transition-all ${i < rating ? color : 'bg-white/10'}`}
        />
      ))}
      <span className="ml-1.5 text-xs font-bold text-white">{rating}/10</span>
    </div>
  );
}

export function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  const statusStyle = STATUS_STYLES[game.status] ?? STATUS_STYLES.Backlog;
  const isPlat = game.status === 'Platinumed';

  return (
    <article className={`glass group relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in ${
      isPlat ? 'hover:border-amber-400/40 hover:shadow-amber-500/15' : 'hover:border-amber-500/20 hover:shadow-amber-500/10'
    }`}>
      {/* Top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
        isPlat ? 'from-amber-400 via-yellow-300 to-amber-400' : 'from-amber-500 via-yellow-500 to-amber-500'
      }`} />

      {/* Platinum shimmer overlay */}
      {isPlat && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-400/5 rounded-2xl" />
      )}

      {/* Status + Format row */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${statusStyle.cls}`}>
          <span className="leading-none">{statusStyle.emoji}</span>
          {statusStyle.label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${
          game.format === 'Physical'
            ? 'text-violet-300 bg-violet-500/10 border-violet-500/20'
            : 'text-sky-300 bg-sky-500/10 border-sky-500/20'
        }`}>
          {game.format === 'Physical' ? <Disc size={10} /> : <Wifi size={10} />}
          {game.format === 'Physical' ? 'Físico' : 'Digital'}
        </span>
      </div>

      {/* Genre + Platform badges */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 rounded-lg border bg-gradient-to-r px-2.5 py-1 text-xs font-medium ${GENRE_GRADIENTS[game.genre] ?? DEFAULT_BADGE}`}>
          <Tag size={11} />
          {game.genre}
        </span>
        {game.platform && (
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`}>
            <Monitor size={11} />
            {game.platform}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="mb-3 font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-amber-300">
        {game.name}
      </h3>

      {/* Rating */}
      {game.difficultyRating != null && (
        <div className="mb-3 flex items-center gap-1.5">
          <Star size={13} className="text-amber-400" />
          <RatingDots rating={game.difficultyRating} />
        </div>
      )}

      {/* Review */}
      {game.review && (
        <div className="mb-3 text-sm italic text-slate-400 line-clamp-2 border-l border-amber-500/20 pl-2">
          "{game.review}"
        </div>
      )}

      {/* Meta */}
      <div className="mt-auto flex flex-col gap-2">
        {game.hoursPlayed != null && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock size={13} className="text-emerald-400" />
            <span><span className="font-semibold text-emerald-400">{game.hoursPlayed}h</span> jugadas</span>
          </div>
        )}
        {game.completionDate && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar size={13} />
            <span>{formatDate(game.completionDate)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
        <button
          onClick={() => onEdit(game)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-amber-500/20 hover:text-amber-300"
        >
          <Edit2 size={14} />
          Editar
        </button>
        <button
          onClick={() => onDelete(game)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400"
        >
          <Trash2 size={14} />
          Eliminar
        </button>
      </div>
    </article>
  );
}
