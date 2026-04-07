import { X, Trophy, Target, Star, Info, Zap } from 'lucide-react';

interface XpInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function XpInfoModal({ isOpen, onClose }: XpInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-surface-900 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="relative border-b border-white/5 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                <Zap size={22} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Sistema de Experiencia (XP)</h2>
                <p className="text-sm text-slate-400">Cómo se calculan tus puntos en HunterVault</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-8 py-8 scrollbar-thin scrollbar-thumb-white/10">
          <div className="space-y-8">
            {/* 1. Base XP */}
            <section>
              <div className="mb-4 flex items-center gap-2 text-amber-300">
                <Target size={18} />
                <h3 className="font-bold border-b border-amber-500/20 pb-1">Experiencia Base</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass rounded-2xl p-4 border-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Por Progreso</p>
                  <p className="text-sm text-slate-300">
                    <span className="text-white font-bold text-lg">10 XP</span> por cada <span className="text-amber-400">1%</span> de trofeos obtenidos.
                  </p>
                </div>
                <div className="glass rounded-2xl p-4 border-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Por Hitos</p>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Completado</span>
                      <span className="text-emerald-400 font-bold">+500 XP</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Platinado</span>
                      <span className="text-amber-400 font-bold">+2000 XP</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Multiplier */}
            <section>
              <div className="mb-4 flex items-center gap-2 text-amber-300">
                <Star size={18} />
                <h3 className="font-bold border-b border-amber-500/20 pb-1">Multiplicador por Dificultad</h3>
              </div>
              <div className="glass rounded-2xl p-5 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <p className="text-sm text-slate-300 mb-4">
                  Cuanto más difícil sea el reto, más XP recibirás. El multiplicador se aplica a la XP base total del juego.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[0, 2, 5, 8, 10].map(diff => (
                    <div key={diff} className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-3 py-2 border border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Dif. {diff}</span>
                      <span className="text-sm font-bold text-white">x{(1 + diff * 0.2).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/5 p-3 border border-amber-500/10">
                  <Info size={14} className="mt-0.5 text-amber-500 shrink-0" />
                  <p className="text-[12px] text-amber-200/70 italic leading-relaxed">
                    Fórmula: 1 + (Dificultad × 0.2). Un juego de dificultad 5 duplicará tu XP (x2.0).
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Leveling */}
            <section>
              <div className="mb-4 flex items-center gap-2 text-amber-300">
                <Trophy size={18} />
                <h3 className="font-bold border-b border-amber-500/20 pb-1">Sistema de Niveles</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Tu nivel se calcula en base a la <span className="text-white font-semibold">XP total acumulada</span> entre todos tus juegos.
                </p>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/5">
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">XP para Nivel 2</p>
                    <p className="text-lg font-bold text-white">400 XP</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">XP para Nivel 5</p>
                    <p className="text-lg font-bold text-white">2,500 XP</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">XP para Nivel 10</p>
                    <p className="text-lg font-bold text-white">10,000 XP</p>
                  </div>
                </div>
                <p className="text-center text-[11px] text-slate-500 italic">
                  Fórmula de nivel: (Nivel × Nivel) × 100 XP
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 bg-white/2 px-8 py-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
