import { Calendar, Coins, Edit2, Tag, Trash2 } from 'lucide-react';
import type { GameSummary } from '../types';

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

const DEFAULT_BADGE = 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/20';

function getBadgeClass(genre: string) {
  return GENRE_GRADIENTS[genre] ?? DEFAULT_BADGE;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(raw: string) {
  // raw = "YYYY-MM-DD"
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  return (
    <article className="glass group relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/10 animate-fade-in">
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Genre badge */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border bg-gradient-to-r px-2.5 py-1 text-xs font-medium ${getBadgeClass(game.genre)}`}
        >
          <Tag size={11} />
          {game.genre}
        </span>
        <span className="text-xs text-slate-500">#{game.id}</span>
      </div>

      {/* Name */}
      <h3 className="mb-4 font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-violet-300">
        {game.name}
      </h3>

      {/* Meta */}
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Coins size={14} className="text-emerald-400" />
          <span className="font-semibold text-emerald-400">{formatPrice(game.price)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar size={14} />
          <span>{formatDate(game.releaseDate)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
        <button
          onClick={() => onEdit(game)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-violet-500/20 hover:text-violet-300"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={() => onDelete(game)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </article>
  );
}
