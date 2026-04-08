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
  MessageSquare,
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

function UserAvatar({ username, url, size = "md" }: { username: string, url?: string, size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-12 w-12 text-lg" : "h-10 w-10 text-sm";
  const initial = username[0]?.toUpperCase() ?? '?';
  
  return (
    <div className={`${dimensions} overflow-hidden rounded-xl ring-2 ring-white/5 transition-all flex items-center justify-center shrink-0`}>
      {url ? (
        <img src={url} alt={username} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-slate-800 text-amber-500 font-bold uppercase">
          {initial}
        </div>
      )}
    </div>
  );
}

export function SocialSidebar({ isOpen, onToggle }: SocialSidebarProps) {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Search Query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => profileApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  // 2. Recommended Hunters
  const { data: recommended = [], isLoading: recommendedLoading } = useQuery({
    queryKey: ['recommended-hunters'],
    queryFn: profileApi.getRecommended,
    enabled: isOpen && searchQuery.length < 2,
  });

  // 3. Activity Feed (Paginated)
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
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < 10 ? undefined : allPages.length + 1;
    },
  });

  const feed = feedData?.pages.flat() || [];

  // 4. Mutations
  const followMut = useMutation({
    mutationFn: (userId: string) => profileApi.followUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-search'] });
      qc.invalidateQueries({ queryKey: ['activity-feed'] });
      qc.invalidateQueries({ queryKey: ['recommended-hunters'] });
      toast.success('¡Ahora sigues a este usuario! 🤝');
    },
  });

  const unfollowMut = useMutation({
    mutationFn: (userId: string) => profileApi.unfollowUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-search'] });
      qc.invalidateQueries({ queryKey: ['activity-feed'] });
      qc.invalidateQueries({ queryKey: ['recommended-hunters'] });
      toast.success('Has dejado de seguir a este usuario.');
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
        className={`absolute -left-10 top-24 flex h-10 w-10 items-center justify-center rounded-l-xl ${
          isOpen ? 'bg-surface-800 text-amber-500' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
        } border border-r-0 border-white/5 transition-all hover:pr-1`}
      >
        {isOpen ? <ChevronRight size={20} /> : <Users size={20} />}
      </button>

      <div className={`h-full w-80 overflow-hidden border-l border-white/10 bg-surface-950/95 backdrop-blur-xl transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Users size={24} className="text-amber-500" />
              Comunidad
            </h2>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar cazadores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-none">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-amber-500" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-500">No se encontraron cazadores.</p>
                ) : (
                  searchResults.map((user: UserSearchResult) => (
                    <div key={user.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/8">
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                        <UserAvatar username={user.username} url={user.avatarUrl} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-white leading-tight hover:text-amber-400 transition-colors">{user.username}</p>
                          <p className="text-[10px] font-semibold text-amber-500">NIVEL {user.level}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => user.isFollowing ? unfollowMut.mutate(user.id) : followMut.mutate(user.id)}
                        disabled={followMut.isPending || unfollowMut.isPending}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                          user.isFollowing ? 'text-red-400 hover:bg-red-400/10' : 'text-amber-500 hover:bg-amber-500/10'
                        }`}
                      >
                        {user.isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recommended Hunters */}
          {searchQuery.length < 2 && recommended.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                <Sparkles size={16} className="text-amber-500" />
                Recomendados
              </h3>
              <div className="space-y-3">
                {recommendedLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-amber-500" />
                  </div>
                ) : (
                  recommended.map((user: UserSearchResult) => (
                    <div key={user.id} className="flex items-center justify-between rounded-xl bg-white/4 p-2.5 hover:bg-white/8 transition-all">
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                        <UserAvatar username={user.username} url={user.avatarUrl} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-white leading-tight hover:text-amber-400 transition-colors">{user.username}</p>
                          <p className="text-[10px] font-semibold text-amber-500">NIVEL {user.level}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => followMut.mutate(user.id)}
                        disabled={followMut.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all"
                      >
                        <UserPlus size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <Activity size={16} />
              Actividad reciente
            </h3>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-none">
              {feedLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-amber-500" />
                </div>
              ) : feed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare size={32} className="mb-2 text-slate-700" />
                  <p className="text-sm text-slate-600">No hay actividad nueva de tus amigos.</p>
                </div>
              ) : (
                feed.map((item: ActivityFeedItem) => (
                  <div key={`${item.id}-${item.updatedAt}`} className="group relative rounded-2xl bg-gradient-to-br from-white/5 to-transparent p-4 transition-all hover:from-white/10">
                    <Link to={`/profile/${item.user.username}`} className="flex gap-3">
                      <UserAvatar username={item.user.username} url={item.user.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{item.user.username}</span>
                          <span className="text-[10px] text-slate-500">• {new Date(item.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                          {item.status === 'Platinumed' ? (
                            <>
                              <span className="text-xs text-slate-400 text-nowrap">ha conseguido el</span>
                              <span className="flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                <Trophy size={10} /> PLATINO
                              </span>
                            </>
                          ) : item.status === 'Completed' ? (
                            <span className="text-xs text-slate-400 text-nowrap">ha completado</span>
                          ) : (
                            <span className="text-xs text-slate-400 text-nowrap">está jugando a</span>
                          )}
                          <span className="truncate text-xs font-semibold text-amber-300">{item.name}</span>
                        </div>

                        {item.trophyPercentage !== undefined && item.status !== 'Platinumed' && (
                          <div className="mt-2 h-1 w-full rounded-full bg-white/5">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 transition-all"
                              style={{ width: `${item.trophyPercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))
              )}

              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-xl border border-white/5 bg-white/4 py-3 text-xs font-bold text-slate-400 transition-all hover:bg-white/8 hover:text-white disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Cargando...
                    </div>
                  ) : (
                    'Cargar más actividad'
                  )}
                </button>
              )}

              {/* Padding for the bottom */}
              <div className="h-4" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
