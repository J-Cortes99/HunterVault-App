import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import {
  Trophy, ArrowLeft, Award, User,
  Loader2, SearchX, Star, Clock, Disc, Wifi, Gamepad2
} from 'lucide-react';
import type { GameSummary, GameStatus } from '../types';
import { GAME_STATUSES } from '../types';

const GENRE_GRADIENTS: Record<string, string> = {
  Action:       'from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/20',
  Adventure:    'from-green-500/20 to-teal-500/20 text-teal-300 border-teal-500/20',
  RPG:          'from-purple-500/20 to-violet-500/20 text-violet-300 border-violet-500/20',
  Strategy:     'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/20',
  Sports:       'from-yellow-500/20 to-lime-500/20 text-lime-300 border-lime-500/20',
  Horror:       'from-red-900/30 to-rose-700/20 text-rose-300 border-rose-500/20',
  Simulation:   'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/20',
  Fighting:     'from-orange-600/20 to-red-600/20 text-red-300 border-red-500/20',
  Racing:       'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/20',
  Puzzle:       'from-pink-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/20',
};
const DEFAULT_BADGE = 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/20';

const PLATFORM_COLORS: Record<string, string> = {
  PC:     'text-sky-400 bg-sky-500/10 border-sky-500/20',
  PS5:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Switch: 'text-red-400 bg-red-500/10 border-red-500/20',
  Retro:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
};
const DEFAULT_PLATFORM = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

const STATUS_STYLES: Record<GameStatus, { label: string; emoji: string; cls: string }> = {
  Backlog:    { label: 'Pendiente',  emoji: '📋', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  Playing:    { label: 'Jugando',    emoji: '🎮', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  Completed:  { label: 'Completado', emoji: '✅', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
  Platinumed: { label: 'Platinado',  emoji: '🏆', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
  Dropped:    { label: 'Abandonado', emoji: '❌', cls: 'text-red-300 bg-red-500/10 border-red-500/20' },
};



function ProfileGameCard({ game, index }: { game: GameSummary; index: number }) {
  const statusStyle = STATUS_STYLES[game.status] ?? STATUS_STYLES.Backlog;
  const isPlat = game.status === 'Platinumed';

  return (
    <article
      className={`glass group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in ${
        isPlat ? 'hover:border-amber-400/40 hover:shadow-amber-500/15' : 'hover:border-amber-500/20 hover:shadow-amber-500/10'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top Section: Cover Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-900">
        {game.coverUrl ? (
          <img 
            src={game.coverUrl} 
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-800 text-surface-400">
            <Gamepad2 size={48} strokeWidth={1} />
          </div>
        )}
        
        {/* Floating Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold backdrop-blur-md ${statusStyle.cls.replace('bg-', 'bg-').replace('/10', '/40')}`}>
            <span className="leading-none">{statusStyle.emoji}</span>
            {statusStyle.label.toUpperCase()}
          </span>
        </div>

        {/* Format Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium backdrop-blur-md ${
            game.format === 'Physical'
              ? 'text-violet-300 bg-violet-900/40 border-violet-500/30'
              : 'text-sky-300 bg-sky-900/40 border-sky-500/30'
          }`}>
            {game.format === 'Physical' ? <Disc size={10} /> : <Wifi size={10} />}
          </span>
        </div>

        {/* Genre Badge (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border bg-surface-950/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${GENRE_GRADIENTS[game.genre] ?? DEFAULT_BADGE}`}>
            {game.genre}
          </span>
        </div>
      </div>

      {/* Bottom Section: Details */}
      <div className="relative flex flex-col p-5">
        {/* Platinum shimmer overlay */}
        {isPlat && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-400/5" />
        )}

        {/* Name & Platform */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold leading-tight text-white transition-colors group-hover:text-amber-300">
              {game.name}
            </h3>
            {game.platform && (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`}>
                {game.platform}
              </span>
            )}
          </div>
        </div>

        {/* Rating & Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-4 border-y border-white/5 py-3">
          {game.difficultyRating != null && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dificultad</span>
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-amber-400" />
                <span className="text-sm font-bold text-white">{game.difficultyRating}/10</span>
              </div>
            </div>
          )}
          {game.hoursPlayed != null && (
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiempo</span>
              <div className="flex items-center justify-end gap-1.5">
                <Clock size={12} className="text-emerald-400" />
                <span className="text-sm font-bold text-white">{game.hoursPlayed}h</span>
              </div>
            </div>
          )}
        </div>

        {/* Review */}
        {game.review && (
          <div className="mb-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Valoración</span>
            <p className="text-sm italic text-slate-400 line-clamp-2 border-l-2 border-amber-500/30 pl-3">
              "{game.review}"
            </p>
          </div>
        )}

        {/* Trophy Progress */}
        {game.trophyPercentage != null && (
          <div className="mb-1">
            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-slate-500">Trofeos</span>
              <span className="text-amber-400">{game.trophyPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(251,191,36,0.3)] ${
                  isPlat ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-shimmer' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${game.trophyPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => profileApi.getByUsername(username!),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900">
        <Loader2 size={40} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-900 px-6">
        <div className="glass rounded-3xl p-10 text-center animate-scale-in max-w-md">
          <SearchX size={48} className="mx-auto mb-4 text-slate-500" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Hunter No Encontrado</h2>
          <p className="text-slate-400 mb-6">
            El hunter <span className="text-amber-400 font-semibold">"{username}"</span> no existe.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Compute stats
  const genreCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};
  profile.games.forEach((g: GameSummary) => {
    genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
    if (g.platform) platformCounts[g.platform] = (platformCounts[g.platform] || 0) + 1;
  });
  const topGenre       = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const platinumedCount = profile.games.filter((g: GameSummary) => g.status === 'Platinumed').length;
  const ratedGames     = profile.games.filter((g: GameSummary) => g.difficultyRating != null);
  const avgRating      = ratedGames.length
    ? (ratedGames.reduce((s: number, g: GameSummary) => s + (g.difficultyRating ?? 0), 0) / ratedGames.length).toFixed(1)
    : '—';

  // Status breakdown for summary bar
  const statusCounts = GAME_STATUSES.map(s => ({
    ...s,
    count: profile.games.filter((g: GameSummary) => g.status === s.value).length,
  })).filter(s => s.count > 0);

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-surface-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
              <Trophy size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Hunter<span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Vault</span>
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Profile hero */}
        <div className="glass relative overflow-hidden rounded-3xl p-8 mb-8 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-yellow-600/10 pointer-events-none" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-xl shadow-amber-500/30">
              <User size={36} className="text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-display text-3xl font-bold text-white mb-1">
                {profile.username}
              </h1>
              <p className="text-slate-400 text-sm">Perfil de Cazador de Trofeos</p>
            </div>
          </div>

          {/* Stats */}
          <div className="relative mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Juegos',      value: profile.totalGames, icon: Gamepad2, color: 'text-violet-400' },
              { label: 'Género Fav',  value: topGenre,            icon: Award,  color: 'text-violet-400' },
              { label: 'Platinados',  value: platinumedCount,     icon: Trophy, color: 'text-yellow-400' },
              { label: 'Dificultad Media',  value: avgRating,           icon: Star,   color: 'text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-4">
                <stat.icon size={18} className={stat.color} />
                <span className="font-display text-lg font-bold text-white">{stat.value}</span>
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          {statusCounts.length > 0 && (
            <div className="relative mt-6 flex flex-wrap gap-2">
              {statusCounts.map(s => (
                <span
                  key={s.value}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  <span className="text-sm leading-none">{s.emoji}</span>
                  {s.label}
                  <span className="ml-0.5 rounded-md bg-white/8 px-1.5 py-0.5 font-bold text-white">
                    {s.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Games grid */}
        {profile.games.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center animate-fade-in">
            <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
            <h2 className="font-display text-xl font-bold text-white mb-2">Sin Hunts Registrados</h2>
            <p className="text-slate-400">Este cazador todavía no ha registrado ningún trophy hunt.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profile.games.map((game: GameSummary, i: number) => (
              <ProfileGameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
