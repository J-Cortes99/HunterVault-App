import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { Trophy, ArrowLeft, Tag, Coins, Calendar, Award, User, Loader2, SearchX, Monitor } from 'lucide-react';

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
  PC:          'text-sky-400 bg-sky-500/10 border-sky-500/20',
  PlayStation: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Xbox:        'text-green-400 bg-green-500/10 border-green-500/20',
  Nintendo:    'text-red-400 bg-red-500/10 border-red-500/20',
  Mobile:      'text-amber-400 bg-amber-500/10 border-amber-500/20',
};
const DEFAULT_PLATFORM = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(raw: string) {
  const [year, month, day] = raw.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
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
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
        <Loader2 size={40} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0f0f1a] px-6">
        <div className="glass rounded-3xl p-10 text-center animate-scale-in max-w-md">
          <SearchX size={48} className="mx-auto mb-4 text-slate-500" />
          <h2 className="font-display text-2xl font-bold text-white mb-2">Hunter Not Found</h2>
          <p className="text-slate-400 mb-6">
            The hunter <span className="text-amber-400 font-semibold">"{username}"</span> doesn't exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
          >
            <ArrowLeft size={16} />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const genreCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};
  profile.games.forEach(g => {
    genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
    if (g.platform) platformCounts[g.platform] = (platformCounts[g.platform] || 0) + 1;
  });
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const platformCount = Object.keys(platformCounts).length;
  const totalValue = profile.games.reduce((s, g) => s + g.price, 0);

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#080812]/80 backdrop-blur-xl">
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
            Back
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
              <p className="text-slate-400 text-sm">Trophy Hunter Profile</p>
            </div>
          </div>

          {/* Stats */}
          <div className="relative mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Hunted', value: profile.totalGames, icon: Trophy, color: 'text-amber-400' },
              { label: 'Fav Genre', value: topGenre, icon: Award, color: 'text-violet-400' },
              { label: 'Platforms', value: platformCount, icon: Monitor, color: 'text-sky-400' },
              { label: 'Invested', value: formatPrice(totalValue), icon: Coins, color: 'text-emerald-400' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-4">
                <stat.icon size={18} className={stat.color} />
                <span className="font-display text-lg font-bold text-white">{stat.value}</span>
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Games grid */}
        {profile.games.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center animate-fade-in">
            <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
            <h2 className="font-display text-xl font-bold text-white mb-2">No Hunts Yet</h2>
            <p className="text-slate-400">This hunter hasn't logged any trophy hunts.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profile.games.map((game, i) => (
              <article
                key={game.id}
                className="glass group relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/10 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border bg-gradient-to-r px-2.5 py-1 text-xs font-medium ${GENRE_GRADIENTS[game.genre] ?? DEFAULT_BADGE}`}>
                    <Tag size={11} />
                    {game.genre}
                  </span>
                  {game.platform && (
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`}>
                      <Monitor size={11} />
                      {game.platform}
                    </span>
                  )}
                </div>

                <h3 className="mb-4 font-display text-lg font-semibold leading-snug text-white transition-colors group-hover:text-amber-300">
                  {game.name}
                </h3>

                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Coins size={14} className="text-emerald-400" />
                    <span className="font-semibold text-emerald-400">{formatPrice(game.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={14} />
                    <span>{formatDate(game.releaseDate)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
