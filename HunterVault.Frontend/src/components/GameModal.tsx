import { X } from 'lucide-react';
import type { Genre, CreateGamePayload, GameDetails } from '../types';
import { GameForm } from './GameForm';

interface GameModalProps {
  title: string;
  genres: Genre[];
  initialData?: GameDetails;
  isSubmitting: boolean;
  onSubmit: (payload: CreateGamePayload) => void;
  onClose: () => void;
}

export function GameModal({ title, genres, initialData, isSubmitting, onSubmit, onClose }: GameModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

      {/* Panel */}
      <div className="glass relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the details below</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <GameForm
          genres={genres}
          initialData={initialData}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
