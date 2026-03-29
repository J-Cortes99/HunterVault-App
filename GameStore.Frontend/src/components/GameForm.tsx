import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, DollarSign, Loader2, Save, Gamepad2, Tag } from 'lucide-react';
import type { Genre, CreateGamePayload, GameDetails } from '../types';

interface GameFormProps {
  genres: Genre[];
  initialData?: GameDetails;
  isSubmitting: boolean;
  onSubmit: (payload: CreateGamePayload) => void;
  onCancel: () => void;
}

export function GameForm({ genres, initialData, isSubmitting, onSubmit, onCancel }: GameFormProps) {
  const [name, setName]           = useState('');
  const [genreId, setGenreId]     = useState('');
  const [price, setPrice]         = useState('');
  const [releaseDate, setRelease] = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setGenreId(String(initialData.genreId));
      setPrice(String(initialData.price));
      setRelease(initialData.releaseDate);
    } else if (genres.length > 0) {
      setGenreId(String(genres[0].id));
    }
  }, [initialData, genres]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())            e.name      = 'Name is required.';
    else if (name.length > 50)   e.name      = 'Max 50 characters.';
    if (!genreId)                e.genreId   = 'Select a genre.';
    const p = parseFloat(price);
    if (isNaN(p) || p < 1)      e.price     = 'Price must be at least $1.';
    else if (p > 100)            e.price     = 'Price must be at most $100.';
    if (!releaseDate)            e.release   = 'Release date is required.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ name: name.trim(), genreId: Number(genreId), price: parseFloat(price), releaseDate });
  }

  const labelCls = 'block mb-1.5 text-sm font-medium text-slate-300';
  const inputCls = (err?: string) =>
    `w-full rounded-xl bg-white/5 border px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:bg-white/8 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 ${
      err ? 'border-red-500/60' : 'border-white/10'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Gamepad2 size={14} className="text-violet-400" /> Game Name
          </span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
          placeholder="e.g. Hollow Knight"
          maxLength={50}
          className={inputCls(errors.name)}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Genre */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Tag size={14} className="text-violet-400" /> Genre
          </span>
        </label>
        <div className="relative">
          <select
            value={genreId}
            onChange={e => { setGenreId(e.target.value); setErrors(p => ({ ...p, genreId: '' })); }}
            className={`${inputCls(errors.genreId)} appearance-none cursor-pointer pr-10`}
          >
            {genres.map(g => (
              <option key={g.id} value={g.id} className="bg-[#1e1e38] text-white">
                {g.name}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {errors.genreId && <p className="mt-1 text-xs text-red-400">{errors.genreId}</p>}
      </div>

      {/* Price + Date row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5 mb-1.5">
              <DollarSign size={14} className="text-emerald-400" /> Price (USD)
            </span>
          </label>
          <input
            type="number"
            value={price}
            onChange={e => { setPrice(e.target.value); setErrors(p => ({ ...p, price: '' })); }}
            placeholder="59.99"
            min={1} max={100} step={0.01}
            className={inputCls(errors.price)}
          />
          {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
        </div>
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} className="text-sky-400" /> Release Date
            </span>
          </label>
          <input
            type="date"
            value={releaseDate}
            onChange={e => { setRelease(e.target.value); setErrors(p => ({ ...p, release: '' })); }}
            className={`${inputCls(errors.release)} [color-scheme:dark]`}
          />
          {errors.release && <p className="mt-1 text-xs text-red-400">{errors.release}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <Loader2 size={15} className="animate-spin-slow" />
          ) : (
            <Save size={15} />
          )}
          {isSubmitting ? 'Saving…' : 'Save Game'}
        </button>
      </div>
    </form>
  );
}
