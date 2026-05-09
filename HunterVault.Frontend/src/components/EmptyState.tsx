import { Crosshair, Plus, Filter } from 'lucide-react';

interface EmptyStateProps {
  hasFilter: boolean;
  onAddGame: () => void;
}

export function EmptyState({ hasFilter, onAddGame }: EmptyStateProps) {
  const Icon = hasFilter ? Filter : Crosshair;

  return (
    <div className="hud-clip hud-panel-bordered relative flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      {/* Decorative scan lines */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.06) 0 1px, transparent 1px 8px)',
        }}
      />

      <div className="hud-clip relative mb-6 flex h-20 w-20 items-center justify-center border border-signal-400/40 bg-signal-400/8 glow-signal animate-pulse-signal">
        <Icon size={32} className="text-signal-300" />
        <svg className="absolute -inset-2 animate-ring-spin opacity-60" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="0.6" strokeDasharray="3 6" />
        </svg>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-hud text-signal-400/70 mb-2">
        // {hasFilter ? 'FILTER_NO_MATCHES' : 'VAULT_EMPTY'}
      </p>

      <h3 className="mb-2 font-display text-2xl font-bold text-white tracking-wide">
        {hasFilter ? 'NO HUNTS COINCIDEN' : 'VAULT VACÍA'}
      </h3>

      <p className="mb-6 max-w-sm text-sm text-slate-400">
        {hasFilter
          ? 'Reajusta los filtros o limpia la búsqueda para ampliar el rango de captura.'
          : 'Inicia tu colección registrando tu primer trophy hunt en el sistema.'}
      </p>

      {!hasFilter && (
        <button
          onClick={onAddGame}
          className="hud-clip-sm hud-cta hud-cta-power flex items-center gap-2 px-6 py-3 text-xs"
        >
          <Plus size={14} strokeWidth={3} /> REGISTRAR_PRIMER_HUNT
        </button>
      )}
    </div>
  );
}
