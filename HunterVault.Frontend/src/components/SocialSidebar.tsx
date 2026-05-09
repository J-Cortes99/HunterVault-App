import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Activity,
  ChevronRight,
  Loader2,
  Trophy,
  Radio,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { profileApi } from '../api/profile';
import type { UserSearchResult, ActivityFeedItem } from '../types';
import toast from 'react-hot-toast';

interface SocialSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

function HunterAvatar({ username, url, size = "md" }: { username: string, url?: string, size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "sm" ? "h-9 w-9 text-[11px]" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  const initial = username[0]?.toUpperCase() ?? '?';

  return (
    <div className={`hud-clip-sm ${dimensions} relative overflow-hidden border border-signal-400/40 bg-gradient-to-br from-signal-500/30 to-power-500/30 transition-all flex items-center justify-center shrink-0`}>
      {url ? (
        <img src={url} alt={username} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-bold text-white">{initial}</span>
      )}
    </div>
  );
}

export function SocialSidebar({ isOpen, onToggle }: SocialSidebarProps) {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => profileApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const { data: recommended = [], isLoading: recommendedLoading } = useQuery({
    queryKey: ['recommended-hunters'],
    queryFn: profileApi.getRecommended,
    enabled: isOpen && searchQuery.length < 2,
  });

  const {
    data: feedData,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['activity-feed'],
    queryFn: ({ pageParam = 1 }) => profileApi.getFeed(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.length < 10 ? undefined : allPages.length + 1,
  });

  const feed = feedData?.pages.flat() || [];

  const followMut = useMutation({
    mutationFn: (userId: string) => profileApi.followUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-search'] });
      qc.invalidateQueries({ queryKey: ['activity-feed'] });
      qc.invalidateQueries({ queryKey: ['recommended-hunters'] });
      toast.success('LINK_ESTABLECIDO · ahora sigues a este hunter');
    },
  });

  const unfollowMut = useMutation({
    mutationFn: (userId: string) => profileApi.unfollowUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-search'] });
      qc.invalidateQueries({ queryKey: ['activity-feed'] });
      qc.invalidateQueries({ queryKey: ['recommended-hunters'] });
      toast.success('LINK_DESCONECTADO');
    },
  });

  return (
    <aside
      className={`fixed right-0 top-0 z-50 h-screen transition-all duration-300 ease-in-out ${
        isOpen ? 'w-80' : 'w-0'
      }`}
    >
      <button
        onClick={onToggle}
        className={`hud-clip-sm absolute -left-10 top-24 flex h-11 w-11 items-center justify-center transition-all ${
          isOpen
            ? 'bg-surface-900 text-signal-300 border border-signal-400/50'
            : 'bg-gradient-to-br from-signal-400 to-signal-600 text-void glow-signal animate-pulse-signal'
        }`}
      >
        {isOpen ? <ChevronRight size={18} /> : <Users size={18} />}
      </button>

      <div className={`h-full w-80 overflow-hidden border-l border-signal-400/20 bg-void/95 backdrop-blur-xl transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Top accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-signal-400 to-transparent opacity-70" />

        <div className="flex h-full flex-col p-5">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-wide text-white">
                <Radio size={16} className="text-signal-400 animate-pulse" />
                COMMS_NETWORK
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-hud text-signal-400/60 mt-0.5">
                // hunter_relay · live
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-signal-400/60" />
              <input
                type="text"
                placeholder="QUERY > buscar hunter…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hud-input hud-clip-sm w-full py-2.5 pl-9 pr-3 text-xs"
              />
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1 scrollbar-none">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-signal-400" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="py-2 text-center font-mono text-[10px] uppercase tracking-hud text-slate-600">
                    // NO_RESULTS_FOUND
                  </p>
                ) : (
                  searchResults.map((user: UserSearchResult) => (
                    <div key={user.id} className="hud-clip-sm flex items-center justify-between border border-signal-400/15 bg-signal-400/[0.04] p-2.5 transition-all hover:border-signal-400/40 hover:bg-signal-400/8">
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-2.5 min-w-0">
                        <HunterAvatar username={user.username} url={user.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-display text-xs font-bold text-white truncate hover:text-signal-300 transition-colors">{user.username}</p>
                          <p className="font-mono text-[9px] uppercase tracking-hud text-power-300">LVL_{user.level}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => user.isFollowing ? unfollowMut.mutate(user.id) : followMut.mutate(user.id)}
                        disabled={followMut.isPending || unfollowMut.isPending}
                        className={`hud-clip-sm flex h-7 w-7 items-center justify-center transition-all ${
                          user.isFollowing
                            ? 'text-alert-300 border border-alert-400/30 hover:bg-alert-500/15 hover:border-alert-400/60'
                            : 'text-signal-300 border border-signal-400/30 hover:bg-signal-400/15 hover:border-signal-400/60'
                        }`}
                      >
                        {user.isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recommended */}
          {searchQuery.length < 2 && recommended.length > 0 && (
            <div className="mb-5">
              <div className="mb-2.5 flex items-center gap-2">
                <Sparkles size={12} className="text-power-300" />
                <h3 className="font-display text-[10px] font-bold uppercase tracking-hud text-power-300">
                  RECOMENDADOS
                </h3>
                <div className="h-px flex-1 bg-power-300/20" />
              </div>
              <div className="space-y-2">
                {recommendedLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-power-400" />
                  </div>
                ) : (
                  recommended.map((user: UserSearchResult) => (
                    <div key={user.id} className="hud-clip-sm flex items-center justify-between border border-power-300/15 bg-power-400/[0.04] p-2.5 transition-all hover:border-power-300/40 hover:bg-power-400/8">
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-2.5 min-w-0">
                        <HunterAvatar username={user.username} url={user.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-display text-xs font-bold text-white truncate hover:text-power-300 transition-colors">{user.username}</p>
                          <p className="font-mono text-[9px] uppercase tracking-hud text-power-300">LVL_{user.level}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => followMut.mutate(user.id)}
                        disabled={followMut.isPending}
                        className="hud-clip-sm flex h-7 w-7 items-center justify-center text-power-300 border border-power-300/30 transition-all hover:bg-power-400/15 hover:border-power-300/60"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-2.5 flex items-center gap-2">
              <Activity size={12} className="text-pulse-400" />
              <h3 className="font-display text-[10px] font-bold uppercase tracking-hud text-pulse-300">
                ACTIVITY_STREAM
              </h3>
              <div className="h-px flex-1 bg-pulse-400/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-pulse-400 animate-pulse" />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none">
              {feedLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-pulse-400" />
                </div>
              ) : feed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Radio size={28} className="mb-2 text-slate-700" />
                  <p className="font-mono text-[10px] uppercase tracking-hud text-slate-600">
                    // NO_SIGNAL · sigue a más hunters
                  </p>
                </div>
              ) : (
                feed.map((item: ActivityFeedItem) => (
                  <Link
                    key={`${item.id}-${item.updatedAt}`}
                    to={`/profile/${item.user.username}`}
                    className="hud-clip-sm group block border border-signal-400/15 bg-signal-400/[0.03] p-3 transition-all hover:border-signal-400/40 hover:bg-signal-400/8"
                  >
                    <div className="flex gap-2.5">
                      <HunterAvatar username={item.user.username} url={item.user.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-display text-xs font-bold text-white group-hover:text-signal-300 transition-colors">
                            {item.user.username}
                          </span>
                          <span className="font-mono text-[8px] tracking-hud text-slate-500">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          {item.status === 'Platinumed' ? (
                            <>
                              <span className="text-[10px] text-slate-400">consigue</span>
                              <span className="hud-clip-tag inline-flex items-center gap-1 border border-power-300/50 bg-power-400/15 px-1.5 py-0.5 font-display text-[9px] font-bold tracking-hud text-power-200">
                                <Trophy size={9} /> PLATINUM
                              </span>
                            </>
                          ) : item.status === 'Completed' ? (
                            <span className="text-[10px] text-slate-400">completa</span>
                          ) : item.status === 'Playing' ? (
                            <span className="text-[10px] text-pulse-400">jugando</span>
                          ) : item.status === 'Dropped' ? (
                            <span className="text-[10px] text-alert-400">abandona</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">añade</span>
                          )}
                          <span className="truncate font-display text-[11px] font-semibold text-signal-300">{item.name}</span>
                        </div>

                        {item.trophyPercentage !== undefined && item.status !== 'Platinumed' && (
                          <div className="mt-2 h-0.5 w-full overflow-hidden bg-surface-800">
                            <div
                              className="h-full bg-gradient-to-r from-signal-500 to-signal-300 transition-all"
                              style={{ width: `${item.trophyPercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}

              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="hud-clip-sm hud-btn-ghost w-full py-2.5 text-[10px] disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={12} className="animate-spin" /> CARGANDO_DATOS...
                    </span>
                  ) : (
                    'LOAD_MORE_PACKETS'
                  )}
                </button>
              )}
              <div className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
