import { Trophy, Plus } from 'lucide-react';

interface EmptyStateProps {
  hasFilter: boolean;
  onAddGame: () => void;
}

export function EmptyState({ hasFilter, onAddGame }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border border-amber-500/20">
        <Trophy size={36} className="text-amber-400" />
      </div>
      <h3 className="mb-2 font-display text-xl font-semibold text-white">
        {hasFilter ? 'No hunts match this filter' : 'No hunts logged yet'}
      </h3>
      <p className="mb-6 max-w-xs text-sm text-slate-400">
        {hasFilter
          ? 'Try selecting a different genre or clear the filter.'
          : 'Start tracking your trophy hunts across all platforms.'}
      </p>
      {!hasFilter && (
        <button
          onClick={onAddGame}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105"
        >
          <Plus size={16} /> Log your first hunt
        </button>
      )}
    </div>
  );
}
