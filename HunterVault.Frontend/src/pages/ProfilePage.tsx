import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import {
  Crosshair, ArrowLeft, Award,
  Loader2, SearchX, Star, Clock, Gamepad2,
  User as UserIcon, Trophy, Zap, Shield
} from 'lucide-react';
import type { GameSummary, GameStatus, UserProfile } from '../types';
import { FaWindows, FaPlaystation, FaXbox } from 'react-icons/fa6';
import { BsNintendoSwitch } from 'react-icons/bs';

const GENRE_COLORS: Record<string, string> = {
  'Action':                       'border-alert-400/40 bg-alert-400/10 text-alert-300',
  'Adventure':                    'border-pulse-400/40 bg-pulse-400/10 text-pulse-300',
  'RPG':                          'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300',
  'Role-playing (RPG)':           'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300',
  'Strategy':                     'border-signal-400/40 bg-signal-400/10 text-signal-300',
  'Shooter':                      'border-power-400/40 bg-power-400/10 text-power-300',
  'Music':                        'border-pink-400/40 bg-pink-500/10 text-pink-300',
  'Platform':                     'border-sky-400/40 bg-sky-500/10 text-sky-300',
  'Sports':                       'border-lime-400/40 bg-lime-500/10 text-lime-300',
  'Sport':                        'border-lime-400/40 bg-lime-500/10 text-lime-300',
  'Horror':                       'border-rose-500/40 bg-rose-500/10 text-rose-300',
  'Simulation':                   'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
  'Simulator':                    'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
  'Fighting':                     'border-orange-500/40 bg-orange-500/10 text-orange-300',
  'Racing':                       'border-power-400/40 bg-power-400/10 text-power-300',
  'Puzzle':                       'border-violet-400/40 bg-violet-500/10 text-violet-300',
  'Indie':                        'border-power-300/40 bg-power-300/10 text-power-200',
  'Arcade':                       'border-signal-400/40 bg-signal-400/10 text-signal-200',
  'Visual Novel':                 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300',
  'Card & Board Game':            'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  'Tactical':                     'border-indigo-400/40 bg-indigo-500/10 text-indigo-300',
  'MOBA':                         'border-violet-500/40 bg-violet-500/10 text-violet-300',
  'Point-and-click':              'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
  'Hack and slash/Beat \'em up':  'border-rose-500/40 bg-rose-500/10 text-rose-300',
  'Real Time Strategy (RTS)':     'border-blue-400/40 bg-blue-500/10 text-blue-300',
  'Turn-based strategy (TBS)':    'border-indigo-400/40 bg-indigo-500/10 text-indigo-300',
};
const DEFAULT_BADGE = 'border-slate-400/40 bg-slate-500/10 text-slate-300';

const PLATFORM_COLORS: Record<string, string> = {
  PC:     'text-sky-300 border-sky-400/40 bg-sky-500/10',
  PS5:    'text-blue-300 border-blue-400/40 bg-blue-500/10',
  Switch: 'text-alert-300 border-alert-400/40 bg-alert-400/10',
  Xbox:   'text-pulse-300 border-pulse-400/40 bg-pulse-400/10',
};
const DEFAULT_PLATFORM = 'text-slate-300 border-slate-400/40 bg-slate-500/10';

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'PC': return <FaWindows size={12} />;
    case 'PS5': return <FaPlaystation size={12} />;
    case 'Switch': return <BsNintendoSwitch size={12} />;
    case 'Xbox': return <FaXbox size={12} />;
    default: return <span className="text-[10px] font-bold uppercase">{platform}</span>;
  }
};

const STATUS_STYLES: Record<GameStatus, { label: string; tag: string; dot: string }> = {
  Backlog:    { label: 'PENDING',    tag: 'border-slate-400/40 bg-slate-500/15 text-slate-200',   dot: 'bg-slate-400' },
  Playing:    { label: 'ACTIVE',     tag: 'border-pulse-400/50 bg-pulse-400/15 text-pulse-300',   dot: 'bg-pulse-400 animate-pulse' },
  Completed:  { label: 'CLEARED',    tag: 'border-signal-400/50 bg-signal-400/15 text-signal-300', dot: 'bg-signal-400' },
  Platinumed: { label: 'PLATINUM',   tag: 'border-power-300/60 bg-power-400/20 text-power-200',   dot: 'bg-power-400' },
  Dropped:    { label: 'ABORTED',    tag: 'border-alert-400/50 bg-alert-500/15 text-alert-300',   dot: 'bg-alert-400' },
};

function ProfileGameCard({ game, index }: { game: GameSummary; index: number }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[game.status] ?? STATUS_STYLES.Backlog;
  const isPlat = game.status === 'Platinumed';

  return (
    <article
      className={`hud-clip group relative flex flex-col overflow-hidden animate-fade-in transition-all duration-300 hover:-translate-y-1 ${
        isPlat ? 'hud-panel-bordered hud-panel-power legendary-border' : 'hud-panel-bordered'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {isPlat && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-power-200/30 to-transparent skew-x-[-20deg] animate-platinum-shine" />
        </div>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-900">
        {game.coverUrl ? (
          <>
            <img src={game.coverUrl} alt={game.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/85 via-void/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void via-void/70 to-transparent" />
            <div className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.18) 0 1px, transparent 1px 4px)' }}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-800 text-surface-500">
            <Gamepad2 size={56} strokeWidth={1.2} />
          </div>
        )}

        <div className="absolute top-3 left-3 z-10">
          <span className={`hud-clip-tag inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-bold tracking-hud font-display backdrop-blur-md ${statusStyle.tag}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        </div>

        {game.platform && (
          <div className="absolute top-3 right-3 z-10">
            <span className={`flex h-7 w-7 items-center justify-center border backdrop-blur-md ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`}>
              <PlatformIcon platform={game.platform} />
            </span>
          </div>
        )}

        {game.genres && game.genres.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1">
            {game.genres.slice(0, 3).map((g, idx) => (
              <span key={idx} className={`inline-flex items-center border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] font-display backdrop-blur-md ${GENRE_COLORS[g] ?? DEFAULT_BADGE}`}>
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col p-5 z-10">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-hud text-signal-400/60">
          // VAULT_ID:{String(game.id).padStart(4, '0')}
        </div>

        <h3
          onClick={() => navigate(`/game/${game.igdbId}/${encodeURIComponent(game.name)}`)}
          className="font-display text-lg font-bold leading-tight text-white mb-3 cursor-pointer transition-colors group-hover:text-signal-300 line-clamp-2"
        >
          {game.name}
        </h3>

        <div className="mb-4 grid grid-cols-2 gap-2 border-y border-signal-400/15 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold tracking-hud text-signal-400/70 font-display">DIFFICULTY</span>
            <div className="flex items-center gap-1.5">
              <Star size={11} className="text-power-400" fill="currentColor" />
              <span className="font-mono text-sm font-bold text-white">
                {game.difficultyRating ?? '--'}<span className="text-slate-500">/10</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[9px] font-bold tracking-hud text-signal-400/70 font-display">PLAYTIME</span>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-pulse-400" />
              <span className="font-mono text-sm font-bold text-white">
                {game.hoursPlayed != null ? `${game.hoursPlayed}h` : '--'}
              </span>
            </div>
          </div>
        </div>

        {game.review && (
          <div className="mb-4">
            <span className="mb-1 block text-[9px] font-bold tracking-hud text-signal-400/70 font-display">// LOG_ENTRY</span>
            <p className="text-xs italic text-slate-300/90 line-clamp-2 border-l-2 border-signal-400/40 pl-3">
              {game.review}
            </p>
          </div>
        )}

        {game.trophyPercentage != null && (
          <div className="mb-1">
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] tracking-hud">
              <span className="text-signal-400/70 font-display">TROPHY_DATA</span>
              <span className={`font-bold ${isPlat ? 'text-power-300 text-glow-power' : 'text-signal-300'}`}>
                {game.trophyPercentage}%
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden bg-surface-800 border border-signal-400/15">
              <div
                className={`h-full transition-all duration-700 ${
                  isPlat ? 'bg-gradient-to-r from-power-400 via-power-200 to-power-400 animate-shimmer' : 'bg-gradient-to-r from-signal-500 to-signal-300'
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="hud-clip hud-panel-bordered px-8 py-6 flex items-center gap-3">
          <Loader2 size={22} className="animate-spin text-signal-400" />
          <span className="font-mono text-xs uppercase tracking-hud text-signal-300">// LOADING_HUNTER_DATA...</span>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="hud-clip hud-panel-bordered hud-panel-alert p-10 text-center animate-scale-in max-w-md">
          <SearchX size={44} className="mx-auto mb-4 text-alert-400" />
          <h2 className="font-display text-2xl font-bold text-white mb-2 tracking-wide">HUNTER NOT FOUND</h2>
          <p className="font-mono text-xs uppercase tracking-hud text-slate-400 mb-1">// HANDLE_404</p>
          <p className="text-slate-300 mb-6">
            El hunter <span className="text-alert-300 font-semibold">"{username}"</span> no existe en esta vault.
          </p>
          <Link to="/" className="hud-clip-sm hud-cta inline-flex items-center gap-2 px-6 py-2.5 text-xs">
            <ArrowLeft size={14} /> VOLVER_AL_INICIO
          </Link>
        </div>
      </div>
    );
  }

  const currentProfile = profile as UserProfile;

  const genreCounts: Record<string, number> = {};
  currentProfile.games.forEach((g: GameSummary) => {
    g.genres?.forEach(genre => { genreCounts[genre] = (genreCounts[genre] || 0) + 1; });
  });
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const platinumedCount = currentProfile.games.filter((g: GameSummary) => g.status === 'Platinumed').length;
  const ratedGames = currentProfile.games.filter((g: GameSummary) => g.difficultyRating != null);
  const avgRating = ratedGames.length
    ? (ratedGames.reduce((s: number, g: GameSummary) => s + (g.difficultyRating ?? 0), 0) / ratedGames.length).toFixed(1)
    : '—';

  const getRankInfo = (level: number) => {
    if (level >= 100) return { name: 'MASTER',   color: 'text-alert-300',  ring: 'rgba(255, 58, 120, 0.6)',  glowClass: 'glow-alert' };
    if (level >= 40)  return { name: 'PLATINUM', color: 'text-signal-300', ring: 'rgba(0, 229, 255, 0.6)',   glowClass: 'glow-signal' };
    if (level >= 20)  return { name: 'GOLD',     color: 'text-power-300',  ring: 'rgba(255, 170, 26, 0.6)',  glowClass: 'glow-power' };
    if (level >= 10)  return { name: 'SILVER',   color: 'text-slate-200',  ring: 'rgba(203, 213, 225, 0.6)', glowClass: '' };
    return                  { name: 'BRONZE',   color: 'text-orange-300', ring: 'rgba(251, 146, 60, 0.6)',  glowClass: '' };
  };

  const rank = getRankInfo(currentProfile.level);
  const prevLevelXp = Math.pow(currentProfile.level, 2) * 100;
  const xpInCurrentLevel = currentProfile.totalXp - prevLevelXp;
  const xpNeededForNextLevel = currentProfile.nextLevelXp - prevLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-signal-400/15 bg-void/80 backdrop-blur-xl">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-signal-400 to-transparent opacity-60" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="group flex items-center gap-3">
            <div className="hud-clip-sm flex h-11 w-11 items-center justify-center bg-gradient-to-br from-signal-400 to-signal-600 glow-signal">
              <Crosshair size={20} className="text-void" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-bold tracking-tight text-white">
                HUNTER<span className="text-signal-400 text-glow-signal">/</span>
                <span className="bg-gradient-to-r from-power-300 to-power-500 bg-clip-text text-transparent">VAULT</span>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-hud text-signal-400/70">
                // HUNTER_PROFILE · PUBLIC_VIEW
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="hud-clip-sm hud-btn-ghost flex items-center gap-2 px-4 py-2 text-[11px]"
          >
            <ArrowLeft size={13} />
            VOLVER
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* HERO PANEL */}
        <div className="hud-clip hud-panel-bordered relative overflow-hidden mb-8 animate-fade-in">
          {/* Banner */}
          <div className="absolute inset-0 h-56 w-full">
            {currentProfile.bannerUrl ? (
              <>
                <img src={currentProfile.bannerUrl} alt="Banner" className="h-full w-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/70 to-void/30" />
              </>
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-signal-500/20 via-power-500/10 to-alert-500/10" />
            )}
            {/* Hex overlay */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(transparent 95%, rgba(0, 229, 255, 0.3) 95%),
                                  repeating-linear-gradient(90deg, transparent 0 39px, rgba(0, 229, 255, 0.2) 39px 40px)`,
                backgroundSize: '100% 4px, 40px 40px',
              }}
            />
          </div>

          {/* HUD frame label */}
          <div className="relative flex items-center gap-3 px-8 pt-6">
            <span className="font-mono text-[10px] uppercase tracking-hud text-signal-400/80">
              // HUNTER_PROFILE_v2 · LIVE_DATA
            </span>
            <div className="h-px flex-1 bg-signal-400/30" />
            <span className="font-mono text-[10px] uppercase tracking-hud text-signal-400/80 animate-data-blink">
              ● ONLINE
            </span>
          </div>

          {/* Avatar + identity */}
          <div className="relative flex flex-col items-center gap-6 pt-24 px-8 pb-6 sm:flex-row sm:items-end">
            {/* Power-core avatar */}
            <div className="relative shrink-0">
              <svg className="absolute -inset-3 animate-ring-spin" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke={rank.ring} strokeWidth="0.6" strokeDasharray="2 6" />
              </svg>
              <div className={`hud-clip relative flex h-32 w-32 items-center justify-center border-2 border-signal-400/40 overflow-hidden bg-surface-900 ${rank.glowClass}`}>
                {currentProfile.avatarUrl ? (
                  <img src={currentProfile.avatarUrl} alt={currentProfile.username} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={64} className="text-surface-500" />
                )}
              </div>
              <div className={`hud-clip-sm absolute -bottom-2 -right-2 border border-void bg-void px-3 py-1 font-display text-xs font-black tracking-hud ${rank.color}`}>
                LVL {currentProfile.level}
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-2">
                {currentProfile.username}
              </h1>
              <p className={`flex items-center justify-center sm:justify-start gap-2 font-display text-xs font-bold uppercase tracking-hud ${rank.color}`}>
                <Award size={13} />
                RANK_{rank.name}
                <span className="font-mono text-slate-500">// {currentProfile.level >= 100 ? 'TIER_S' : currentProfile.level >= 40 ? 'TIER_A' : currentProfile.level >= 20 ? 'TIER_B' : currentProfile.level >= 10 ? 'TIER_C' : 'TIER_D'}</span>
              </p>
              <div className="mt-3 max-w-2xl">
                <p className="text-slate-300 leading-relaxed text-sm italic">
                  {currentProfile.bio || '// Este hunter no ha registrado su biografía estratégica.'}
                </p>
              </div>
            </div>
          </div>

          {/* XP bar */}
          <div className="relative px-8 pb-6">
            <div className="mb-2 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-hud">
              <span className="flex items-center gap-2 text-signal-400/80">
                <Zap size={11} className="text-power-400" />
                POWER_CORE_PROGRESS
              </span>
              <span className="text-white">
                <span className="text-power-300 text-glow-power font-bold">{currentProfile.totalXp.toLocaleString()}</span>
                <span className="text-slate-500"> / {currentProfile.nextLevelXp.toLocaleString()} XP</span>
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden border border-signal-400/20 bg-void/60 hud-clip-sm">
              <div
                className="h-full bg-gradient-to-r from-power-400 via-power-200 to-power-400 animate-shimmer transition-all duration-1000"
                style={{ width: `${progressPercent}%`, backgroundSize: '400px 100%' }}
              />
              {/* Tick marks */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(0,0,0,0.5) calc(10% - 1px) 10%)' }}
              />
            </div>
            <div className="mt-1 font-mono text-[9px] tracking-hud text-slate-500">
              // {progressPercent.toFixed(1)}% al siguiente nivel
            </div>

            {/* Stats grid */}
            <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'TOTAL_HUNTS',     value: currentProfile.totalGames, icon: Gamepad2, accent: 'text-signal-300', border: 'border-signal-400/30' },
                { label: 'GENRE_AFFINITY', value: topGenre,                   icon: Shield,   accent: 'text-pulse-300',  border: 'border-pulse-400/30' },
                { label: 'PLATINUMS',       value: platinumedCount,            icon: Trophy,   accent: 'text-power-300',  border: 'border-power-300/30' },
                { label: 'AVG_DIFFICULTY',  value: avgRating,                  icon: Star,     accent: 'text-alert-300',  border: 'border-alert-400/30' },
              ].map(stat => (
                <div key={stat.label} className={`hud-clip-sm flex flex-col items-center gap-1 border bg-void/40 px-4 py-3 transition-colors hover:bg-signal-400/5 ${stat.border}`}>
                  <stat.icon size={16} className={`${stat.accent} mb-1`} />
                  <span className="font-display text-2xl font-black text-white">{stat.value}</span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-hud text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="hud-stripes h-3 w-12 hud-clip-sm" />
          <span className="font-mono text-[10px] uppercase tracking-hud text-signal-400/60">
            HUNTER.VAULT_INVENTORY [{currentProfile.games.length}]
          </span>
          <div className="h-px flex-1 bg-signal-400/15" />
        </div>

        {currentProfile.games.length === 0 ? (
          <div className="hud-clip hud-panel-bordered p-12 text-center animate-fade-in">
            <Trophy size={42} className="mx-auto mb-4 text-slate-600" />
            <h2 className="font-display text-xl font-bold text-white mb-2 tracking-wide">VAULT_VACÍA</h2>
            <p className="font-mono text-xs uppercase tracking-hud text-slate-500">
              // ESTE_HUNTER_NO_HA_REGISTRADO_HUNTS
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentProfile.games.map((game: GameSummary, i: number) => (
              <ProfileGameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
