import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  gameName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ gameName, isDeleting, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

      {/* Dialog */}
      <div className="glass relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-in">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30">
          <AlertTriangle size={22} className="text-red-400" />
        </div>

        {/* Content */}
        <h2 className="mb-2 font-display text-lg font-semibold text-white">Eliminar de la colección</h2>
        <p className="mb-6 text-sm text-slate-400">
          ¿Estás seguro de que quieres eliminar{' '}
          <span className="font-semibold text-white">"{gameName}"</span>?
          Esta acción no se puede deshacer.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isDeleting ? (
              <Loader2 size={15} className="animate-spin-slow" />
            ) : (
              <Trash2 size={15} />
            )}
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
