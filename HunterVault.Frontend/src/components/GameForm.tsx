import { useEffect, useState } from 'react';
import {
  ChevronDown, Loader2, Save, Gamepad2,
  Monitor, Clock, Star, FileText, Trophy,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { igdbApi } from '../api/igdb';
import { useDebounce } from '../hooks/useDebounce';
import type { CreateGamePayload, GameDetails, GameStatus, IgdbSearchResult } from '../types';
import { GAME_STATUSES, PLATFORMS } from '../types';

interface GameFormProps {
  initialData?: GameDetails;
  isSubmitting: boolean;
  onSubmit: (payload: CreateGamePayload) => void;
  onCancel: () => void;
}

export function GameForm({ initialData, isSubmitting, onSubmit, onCancel }: GameFormProps) {
  const [name, setName] = useState('');
  const [igdbId, setIgdbId] = useState<number>();
  const [isFocused, setIsFocused] = useState(false);
  const debouncedName = useDebounce(name, 400);

  const { data: suggestions = [], isFetching: isSearchingIgdb } = useQuery({
    queryKey: ['igdbSearch', debouncedName],
    queryFn: () => igdbApi.searchGames(debouncedName),
    enabled: isFocused && debouncedName.trim().length >= 2,
    staleTime: 60000,
  });

  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [status, setStatus] = useState<GameStatus>('Backlog');
  const [hoursPlayed, setHoursPlayed] = useState('');
  const [difficultyRating, setRating] = useState<number | null>(null);
  const [trophyPercentage, setTrophyPercentage] = useState('');
  const [review, setReview] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);

      setPlatform(initialData.platform || PLATFORMS[0]);
      setStatus(initialData.status || 'Backlog');
      setHoursPlayed(initialData.hoursPlayed != null ? String(initialData.hoursPlayed) : '');
      setRating(initialData.difficultyRating ?? null);
      setTrophyPercentage(initialData.trophyPercentage != null ? String(initialData.trophyPercentage) : '');
      setReview(initialData.review ?? '');
      setIgdbId(initialData.igdbId);
    }
  }, [initialData]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio.';
    else if (name.length > 200) e.name = 'Máximo 200 caracteres.';

    if (!platform) e.platform = 'Selecciona una plataforma.';
    const h = parseInt(hoursPlayed);
    if (hoursPlayed && (isNaN(h) || h < 0 || h > 9999)) e.hours = 'Horas entre 0 y 9999.';
    if (difficultyRating !== null && (difficultyRating < 1 || difficultyRating > 10))
      e.rating = 'La puntuación debe ser entre 1 y 10.';
    const tp = parseInt(trophyPercentage);
    if ((status === 'Playing' || status === 'Completed') && trophyPercentage && (isNaN(tp) || tp < 0 || tp > 100))
      e.trophy = 'El porcentaje debe ser entre 0 y 100.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      name: name.trim(),

      platform,
      status,
      hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
      difficultyRating: difficultyRating ?? undefined,
      trophyPercentage: (status === 'Playing' || status === 'Completed') && trophyPercentage ? parseInt(trophyPercentage) : undefined,
      review: review.trim() || undefined,
      igdbId,
    });
  }

  const labelCls = 'block mb-1.5 text-sm font-medium text-slate-300';
  const inputCls = (err?: string) =>
    `w-full rounded-xl bg-white/5 border px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:bg-white/8 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${err ? 'border-red-500/60' : 'border-white/10'
    }`;

  const statusInfo = GAME_STATUSES.find(s => s.value === status);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {/* Name */}
      <div className="relative z-50">
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Gamepad2 size={14} className="text-purple-400" /> Nombre del Juego
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="ej. Hollow Knight"
            maxLength={200}
            autoComplete="off"
            className={inputCls(errors.name)}
          />
          {isSearchingIgdb && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
          )}
        </div>

        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1e1e38] p-2 shadow-xl shadow-black/50 backdrop-blur-xl animate-fade-in z-50 scrollbar-thin">
            {suggestions.map((game: IgdbSearchResult, idx: number) => (
              <button
                key={`${game.name}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setName(game.name);
                  setIgdbId(game.id);
                  setIsFocused(false);
                  setErrors(p => ({ ...p, name: '' }));
                }}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
              >
                {game.coverUrl ? (
                  <img src={game.coverUrl} alt={game.name} className="h-10 w-7 rounded-[4px] object-cover shadow-sm bg-surface-900" />
                ) : (
                  <div className="flex h-10 w-7 items-center justify-center rounded-[4px] bg-surface-900 text-slate-500">
                    <Gamepad2 size={14} />
                  </div>
                )}
                <span className="font-medium text-white">{game.name}</span>
              </button>
            ))}
          </div>
        )}

        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Platform */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Monitor size={14} className="text-sky-400" /> Plataforma
          </span>
        </label>
        <div className="relative">
          <select
            value={platform}
            onChange={e => { setPlatform(e.target.value); setErrors(p => ({ ...p, platform: '' })); }}
            className={`${inputCls(errors.platform)} appearance-none cursor-pointer pr-10`}
          >
            {PLATFORMS.map(p => (
              <option key={p} value={p} className="bg-[#1e1e38] text-white">{p}</option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {errors.platform && <p className="mt-1 text-xs text-red-400">{errors.platform}</p>}
      </div>

      {/* Status */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <span className="text-base leading-none">{statusInfo?.emoji}</span> Estado
          </span>
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {GAME_STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all ${status === s.value
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                : 'border-white/8 bg-white/4 text-slate-400 hover:bg-white/8 hover:text-slate-200'
                }`}
            >
              <span className="text-base leading-none">{s.emoji}</span>
              <span className="text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
        
        {/* Trophy Percentage (Visible solo si Playing o Completed) */}
        {(status === 'Playing' || status === 'Completed') && (
          <div className="mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-400" /> Progreso de Trofeos
              </label>
              <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                {trophyPercentage || 0}%
              </span>
            </div>
            <div className="relative flex items-center group">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={trophyPercentage || 0}
                onChange={e => { setTrophyPercentage(e.target.value); setErrors(p => ({ ...p, trophy: '' })); }}
                className="h-2 w-full appearance-none rounded-lg bg-white/10 accent-amber-500 cursor-pointer transition-all hover:bg-white/15 focus:outline-none"
              />
            </div>
            {errors.trophy && <p className="mt-1 text-xs text-red-400">{errors.trophy}</p>}
          </div>
        )}
      </div>

      {/* Hours */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Clock size={14} className="text-emerald-400" /> Horas Jugadas
          </span>
        </label>
        <input
          type="number"
          value={hoursPlayed}
          onChange={e => { setHoursPlayed(e.target.value); setErrors(p => ({ ...p, hours: '' })); }}
          placeholder="ej. 45"
          min={0} max={9999} step={1}
          className={inputCls(errors.hours)}
        />
        {errors.hours && <p className="mt-1 text-xs text-red-400">{errors.hours}</p>}
      </div>

      {/* Enjoyment Rating */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Star size={14} className="text-amber-400" /> Dificultad
            {difficultyRating !== null && (
              <span className="ml-auto text-amber-400 font-bold">{difficultyRating}/10</span>
            )}
          </span>
        </label>
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(difficultyRating === n ? null : n)}
              className={`flex h-9 w-full items-center justify-center rounded-lg border text-sm font-semibold transition-all ${difficultyRating !== null && n <= difficultyRating
                ? n <= 4
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : n <= 7
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'border-red-500/50 bg-red-500/20 text-red-300'
                : 'border-white/8 bg-white/4 text-slate-500 hover:border-amber-500/30 hover:text-slate-300'
                }`}
            >
              {n}
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-red-400">{errors.rating}</p>}
      </div>

      {/* Review */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <FileText size={14} className="text-slate-400" /> Reseña Personal
            <span className="ml-auto text-xs text-slate-500">{review.length}/2000</span>
          </span>
        </label>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="¿Qué te pareció el juego? Comparte tu opinión..."
          className={`${inputCls()} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <Loader2 size={15} className="animate-spin-slow" />
          ) : (
            <Save size={15} />
          )}
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
