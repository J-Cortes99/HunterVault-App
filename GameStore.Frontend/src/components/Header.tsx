import { Gamepad2, Sparkles } from 'lucide-react';

interface HeaderProps {
  onAddGame: () => void;
}

export function Header({ onAddGame }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#080812]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Gamepad2 size={20} className="text-white" />
          </div>
          <div>
            <span className="font-display block text-xl font-bold tracking-tight text-white">
              Game
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Store
              </span>
            </span>
            <span className="text-xs text-slate-500">Catalog Manager</span>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={onAddGame}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-105 hover:shadow-violet-500/40 active:scale-95"
        >
          <Sparkles size={16} className="transition-transform duration-200 group-hover:rotate-12" />
          Add Game
        </button>
      </div>
    </header>
  );
}
