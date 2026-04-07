import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import {
  Trophy, ArrowLeft, Award,
  Loader2, SearchX, Star, Clock, Gamepad2,
  User as UserIcon
} from 'lucide-react';
import type { GameSummary, GameStatus, UserProfile } from '../types';
import { FaWindows, FaPlaystation, FaXbox } from 'react-icons/fa6';
import { BsNintendoSwitch } from 'react-icons/bs';

const GENRE_GRADIENTS: Record<string, string> = {
  'Action': 'from-red-500/20 to-orange-500/20 text-orange-300 border-orange-500/20',
  'Adventure': 'from-green-500/20 to-teal-500/20 text-teal-300 border-teal-500/20',
  'RPG': 'from-purple-500/20 to-violet-500/20 text-violet-300 border-purple-500/20',
  'Role-playing (RPG)': 'from-purple-500/20 to-violet-500/20 text-violet-300 border-purple-500/20',
  'Strategy': 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/20',
  'Shooter': 'from-orange-500/20 to-red-600/20 text-orange-400 border-red-500/20',
  'Music': 'from-pink-500/20 to-rose-400/20 text-pink-300 border-rose-500/20',
  'Platform': 'from-sky-400/20 to-blue-500/20 text-sky-300 border-sky-400/20',
  'Sports': 'from-yellow-500/20 to-lime-500/20 text-lime-300 border-lime-500/20',
  'Sport': 'from-yellow-500/20 to-lime-500/20 text-lime-300 border-lime-500/20',
  'Horror': 'from-red-900/30 to-rose-700/20 text-rose-300 border-rose-500/20',
  'Simulation': 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/20',
  'Simulator': 'from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/20',
  'Fighting': 'from-orange-600/20 to-red-600/20 text-red-300 border-red-500/20',
  'Racing': 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/20',
  'Puzzle': 'from-pink-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/20',
  'Indie': 'from-amber-400/20 to-yellow-600/20 text-amber-200 border-amber-400/20',
  'Arcade': 'from-cyan-400/20 to-fuchsia-500/20 text-cyan-200 border-cyan-400/20',
  'Visual Novel': 'from-fuchsia-400/20 to-purple-500/20 text-fuchsia-300 border-purple-400/20',
  'Card & Board Game': 'from-emerald-600/20 to-teal-500/20 text-emerald-300 border-emerald-500/20',
  'Tactical': 'from-indigo-500/20 to-blue-700/20 text-indigo-300 border-indigo-500/20',
  'MOBA': 'from-violet-600/20 to-purple-700/20 text-violet-300 border-violet-500/20',
  'Point-and-click': 'from-cyan-500/20 to-teal-600/20 text-cyan-300 border-teal-500/20',
  'Hack and slash/Beat \'em up': 'from-rose-600/20 to-red-700/20 text-rose-300 border-red-600/20',
  'Real Time Strategy (RTS)': 'from-blue-600/20 to-cyan-700/20 text-blue-200 border-blue-500/20',
  'Turn-based strategy (TBS)': 'from-indigo-600/20 to-violet-700/20 text-indigo-200 border-indigo-500/20',
};
const DEFAULT_BADGE = 'from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/20';

const PLATFORM_COLORS: Record<string, string> = {
  PC:     'text-sky-400 bg-sky-500/10 border-sky-500/20',
  PS5:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Switch: 'text-red-400 bg-red-500/10 border-red-500/20',
  Xbox:   'text-green-400 bg-green-500/10 border-green-500/20',
};
const DEFAULT_PLATFORM = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'PC': return <FaWindows size={14} />;
    case 'PS5': return <FaPlaystation size={14} />;
    case 'Switch': return <BsNintendoSwitch size={14} />;
    case 'Xbox': return <FaXbox size={14} />;
    default: return <span className="text-[10px] font-bold uppercase px-0.5">{platform}</span>;
  }
};

const STATUS_STYLES: Record<GameStatus, { label: string; emoji: string; cls: string }> = {
  Backlog:    { label: 'Pendiente',  emoji: '📋', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
  Playing:    { label: 'Jugando',    emoji: '🎮', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  Completed:  { label: 'Completado', emoji: '✅', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
  Platinumed: { label: 'Platinado',  emoji: '🏆', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/25' },
  Dropped:    { label: 'Abandonado', emoji: '❌', cls: 'text-red-300 bg-red-500/10 border-red-500/20' },
};

function ProfileGameCard({ game, index }: { game: GameSummary; index: number }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[game.status] ?? STATUS_STYLES.Backlog;
  const isPlat = game.status === 'Platinumed';

  return (
    <article
      className={`glass group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in ${
        isPlat ? 'hover:border-amber-400/40 hover:shadow-amber-500/15' : 'hover:border-amber-500/20 hover:shadow-amber-500/10'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
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
        
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold backdrop-blur-md ${statusStyle.cls.replace('bg-', 'bg-').replace('/10', '/40')}`}>
            <span className="leading-none">{statusStyle.emoji}</span>
            {statusStyle.label.toUpperCase()}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 z-10 flex gap-1 flex-wrap w-full pr-4">
          {game.genres && game.genres.slice(0, 3).map((g, idx) => (
            <span key={idx} className={`inline-flex items-center gap-1.5 rounded-lg border bg-surface-950/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${GENRE_GRADIENTS[g] ?? DEFAULT_BADGE}`}>
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col p-5">
        {isPlat && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-400/5" />
        )}

        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={() => navigate(`/game/${game.igdbId}/${encodeURIComponent(game.name)}`)}
              className="font-display text-lg font-bold leading-tight text-white transition-colors group-hover:text-amber-300 cursor-pointer hover:underline"
            >
              {game.name}
            </h3>
            {game.platform && (
              <span className={`shrink-0 rounded p-1.5 flex items-center justify-center ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`} title={game.platform}>
                <PlatformIcon platform={game.platform} />
              </span>
            )}
          </div>
        </div>

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

        {game.review && (
          <div className="mb-4">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Valoración</span>
            <p className="text-sm italic text-slate-400 line-clamp-2 border-l-2 border-amber-500/30 pl-3">
              "{game.review}"
            </p>
          </div>
        )}

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

import { useNavigate } from 'react-router-dom';

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

  const currentProfile = profile as UserProfile;

  const genreCounts: Record<string, number> = {};
  currentProfile.games.forEach((g: GameSummary) => {
    g.genres?.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const platinumedCount = currentProfile.games.filter((g: GameSummary) => g.status === 'Platinumed').length;
  const ratedGames = currentProfile.games.filter((g: GameSummary) => g.difficultyRating != null);
  const avgRating = ratedGames.length
    ? (ratedGames.reduce((s: number, g: GameSummary) => s + (g.difficultyRating ?? 0), 0) / ratedGames.length).toFixed(1)
    : '—';

  const getRankInfo = (level: number) => {
    if (level >= 100) return { name: 'Master Hunter', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/20' };
    if (level >= 40) return { name: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' };
    if (level >= 20) return { name: 'Oro', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' };
    if (level >= 10) return { name: 'Plata', color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/30', glow: 'shadow-slate-400/20' };
    return { name: 'Bronce', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' };
  };

  const rank = getRankInfo(currentProfile.level);
  const prevLevelXp = Math.pow(currentProfile.level, 2) * 100;
  const xpInCurrentLevel = currentProfile.totalXp - prevLevelXp;
  const xpNeededForNextLevel = currentProfile.nextLevelXp - prevLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return (
    <div className="min-h-screen bg-surface-900">
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
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="glass relative overflow-hidden rounded-3xl mb-8 animate-fade-in group/hero">
          <div className="absolute inset-0 h-48 w-full bg-surface-950 group-hover/hero:opacity-90 transition-opacity">
            {currentProfile.bannerUrl ? (
              <div className="relative h-full w-full">
                <img 
                  src={currentProfile.bannerUrl} 
                  alt="Banner" 
                  className="h-full w-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/40 to-transparent" />
              </div>
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-amber-600/20 via-transparent to-yellow-600/10" />
            )}
          </div>
          
          <div className="relative pt-32 p-8 flex flex-col items-center sm:items-end sm:flex-row gap-8">
            <div className="relative group/avatar shrink-0">
              <div className={`flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-surface-900 overflow-hidden bg-surface-800 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105`}>
                {currentProfile.avatarUrl ? (
                  <img src={currentProfile.avatarUrl} alt={currentProfile.username} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={64} className="text-surface-600" />
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 rounded-xl border-2 border-surface-900 ${rank.bg.replace('/10', '/100')} ${rank.color} px-3 py-1 text-xs font-black shadow-xl`}>
                LVL {currentProfile.level}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="mb-4">
                <h1 className="font-display text-4xl font-black text-white mb-2 tracking-tight">
                  {currentProfile.username}
                </h1>
                <p className={`text-sm font-bold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2 ${rank.color}`}>
                  <Award size={16} />
                  RANGO {rank.name}
                </p>
              </div>

              <div className="max-w-2xl">
                <p className="text-slate-300 leading-relaxed text-sm lg:text-base italic">
                  {currentProfile.bio || "Este cazador todavía no ha escrito su biografía estratégica."}
                </p>
              </div>
            </div>
          </div>

          <div className="relative px-8 pb-8">
            <div className="max-w-full">
              <div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">Progreso de Nivel</span>
                <span className="text-white">{currentProfile.totalXp.toLocaleString()} / {currentProfile.nextLevelXp.toLocaleString()} XP</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 border border-white/5 shadow-inner p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 shadow-lg bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer`}
                  style={{ width: `${progressPercent}%`, backgroundColor: 'currentColor', color: rank.color.replace('text-', '') }}
                />
              </div>
            </div>

            <div className="relative mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Hunts Totales', value: currentProfile.totalGames, icon: Gamepad2, color: 'text-violet-400' },
                { label: 'Género Predilecto', value: topGenre, icon: Award, color: 'text-emerald-400' },
                { label: 'Títulos Platinados', value: platinumedCount, icon: Trophy, color: 'text-amber-400' },
                { label: 'Dificultad Media', value: avgRating, icon: Star, color: 'text-sky-400' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-4 transition-colors hover:bg-white/[0.05]">
                  <stat.icon size={18} className={`${stat.color} mb-1`} />
                  <span className="font-display text-2xl font-black text-white">{stat.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {currentProfile.games.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center animate-fade-in">
            <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
            <h2 className="font-display text-xl font-bold text-white mb-2">Sin Hunts Registrados</h2>
            <p className="text-slate-400">Este cazador todavía no ha registrado ningún trophy hunt.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentProfile.games.map((game: GameSummary, i: number) => (
              <ProfileGameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
