import { useEffect, useState } from 'react';
import {
  Calendar, ChevronDown, Loader2, Save, Gamepad2, Tag,
  Monitor, Clock, Star, FileText, Disc, Wifi, Trophy,
} from 'lucide-react';
import type { Genre, CreateGamePayload, GameDetails, GameStatus, GameFormat } from '../types';
import { GAME_STATUSES, PLATFORMS, FORMATS } from '../types';

interface GameFormProps {
  genres: Genre[];
  initialData?: GameDetails;
  isSubmitting: boolean;
  onSubmit: (payload: CreateGamePayload) => void;
  onCancel: () => void;
}

export function GameForm({ genres, initialData, isSubmitting, onSubmit, onCancel }: GameFormProps) {
  const [name, setName] = useState('');
  const [genreId, setGenreId] = useState('');
  const [completionDate, setCompletion] = useState('');
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [status, setStatus] = useState<GameStatus>('Backlog');
  const [format, setFormat] = useState<GameFormat>('Digital');
  const [hoursPlayed, setHoursPlayed] = useState('');
  const [difficultyRating, setRating] = useState<number | null>(null);
  const [trophyPercentage, setTrophyPercentage] = useState('');
  const [review, setReview] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setGenreId(String(initialData.genreId));
      setCompletion(initialData.completionDate ?? '');
      setPlatform(initialData.platform || PLATFORMS[0]);
      setStatus(initialData.status || 'Backlog');
      setFormat(initialData.format || 'Digital');
      setHoursPlayed(initialData.hoursPlayed != null ? String(initialData.hoursPlayed) : '');
      setRating(initialData.difficultyRating ?? null);
      setTrophyPercentage(initialData.trophyPercentage != null ? String(initialData.trophyPercentage) : '');
      setReview(initialData.review ?? '');
    } else if (genres.length > 0) {
      setGenreId(String(genres[0].id));
    }
  }, [initialData, genres]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio.';
    else if (name.length > 50) e.name = 'Máximo 50 caracteres.';
    if (!genreId) e.genreId = 'Selecciona un género.';
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
      genreId: Number(genreId),
      completionDate: completionDate || undefined,
      platform,
      status,
      format,
      hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
      difficultyRating: difficultyRating ?? undefined,
      trophyPercentage: (status === 'Playing' || status === 'Completed') && trophyPercentage ? parseInt(trophyPercentage) : undefined,
      review: review.trim() || undefined,
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
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Gamepad2 size={14} className="text-purple-400" /> Nombre del Juego
          </span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
          placeholder="ej. Hollow Knight"
          maxLength={50}
          className={inputCls(errors.name)}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Genre + Platform row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Genre */}
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5 mb-1.5">
              <Tag size={14} className="text-red-400" /> Género
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
            <label className={labelCls}>
              <span className="flex items-center gap-1.5 mb-1.5">
                <Trophy size={14} className="text-amber-400" /> Progreso de Trofeos (%)
              </span>
            </label>
            <input
              type="number"
              value={trophyPercentage}
              onChange={e => { setTrophyPercentage(e.target.value); setErrors(p => ({ ...p, trophy: '' })); }}
              placeholder="ej. 85"
              min={0} max={100} step={1}
              className={inputCls(errors.trophy)}
            />
            {errors.trophy && <p className="mt-1 text-xs text-red-400">{errors.trophy}</p>}
          </div>
        )}
      </div>

      {/* Format toggle */}
      <div>
        <label className={labelCls}>
          <span className="flex items-center gap-1.5 mb-1.5">
            <Disc size={14} className="text-violet-400" /> Formato
          </span>
        </label>
        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
          {FORMATS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${format === f.value
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {f.value === 'Digital' ? <Wifi size={14} /> : <Disc size={14} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hours + Release Date row */}
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} className="text-sky-400" /> Fecha de Finalización
            </span>
          </label>
          <input
            type="date"
            value={completionDate}
            onChange={e => { setCompletion(e.target.value); setErrors(p => ({ ...p, completion: '' })); }}
            className={`${inputCls(errors.completion)} [color-scheme:dark]`}
          />
          {errors.completion && <p className="mt-1 text-xs text-red-400">{errors.completion}</p>}
        </div>
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
