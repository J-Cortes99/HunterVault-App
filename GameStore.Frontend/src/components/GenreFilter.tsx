import { Layers } from 'lucide-react';
import type { Genre } from '../types';

interface GenreFilterProps {
  genres: Genre[];
  selected: number | null;
  onChange: (id: number | null) => void;
}

export function GenreFilter({ genres, selected, onChange }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
        <Layers size={13} />
        <span>Filter</span>
      </div>
      <button
        onClick={() => onChange(null)}
        className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
          selected === null
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
        }`}
      >
        All
      </button>
      {genres.map(genre => (
        <button
          key={genre.id}
          onClick={() => onChange(genre.id)}
          className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
            selected === genre.id
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
          }`}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
}
