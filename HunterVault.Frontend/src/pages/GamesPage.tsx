import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Star, Gamepad2, Clock, ListFilter, ChevronDown } from 'lucide-react';
import type { GameSummary, GameDetails, CreateGamePayload, GameStatus, UpdateProfilePayload } from '../types';
import { GAME_STATUSES } from '../types';
import { gamesApi } from '../api/games';
import { profileApi } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { GameCard } from '../components/GameCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { GameModal } from '../components/GameModal';
import { DeleteModal } from '../components/DeleteModal';
import { ProfileEditModal } from '../components/ProfileEditModal';

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; gameDetails: GameDetails }
  | { type: 'delete'; game: GameSummary };

type StatusFilter = 'All' | GameStatus;

const STATUS_TABS: { value: StatusFilter; emoji: string; label: string }[] = [
  { value: 'All',        emoji: '🎯', label: 'Todos'      },
  { value: 'Backlog',    emoji: '📋', label: 'Pendiente'  },
  { value: 'Playing',   emoji: '🎮', label: 'Jugando'    },
  { value: 'Completed', emoji: '✅', label: 'Completado' },
  { value: 'Platinumed',emoji: '🏆', label: 'Platinado'  },
  { value: 'Dropped',   emoji: '❌', label: 'Abandonado' },
];

type SortOption = 'recent' | 'percent-desc' | 'percent-asc' | 'diff-desc' | 'diff-asc' | 'hours-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'percent-desc', label: 'Mayor % completado' },
  { value: 'percent-asc', label: 'Menor % completado' },
  { value: 'hours-desc', label: 'Más horas invertidas' },
  { value: 'diff-desc', label: 'Mayor dificultad' },
  { value: 'diff-asc', label: 'Menor dificultad' },
];

export function GamesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [modal, setModal]                     = useState<ModalState>({ type: 'none' });
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [sortOption, setSortOption]           = useState<SortOption>('recent');
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatus]             = useState<StatusFilter>('All');

  /* ─── Queries ─── */
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: gamesApi.getAll,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.username],
    queryFn: () => profileApi.getByUsername(user!.username),
    enabled: !!user?.username,
  });

  /* ─── Mutations ─── */
  const createMut = useMutation({
    mutationFn: (p: CreateGamePayload) => gamesApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      setModal({ type: 'none' });
      toast.success('¡Hunt registrado! 🏆');
    },
    onError: () => toast.error('Error al registrar el hunt.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateGamePayload }) =>
      gamesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      setModal({ type: 'none' });
      toast.success('¡Juego actualizado!');
    },
    onError: () => toast.error('Error al actualizar el juego.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => gamesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      setModal({ type: 'none' });
      toast.success('Juego eliminado.');
    },
    onError: () => toast.error('Error al eliminar el juego.'),
  });

  const updateProfileMut = useMutation({
    mutationFn: (p: UpdateProfilePayload) => profileApi.updateProfile(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.username] });
      toast.success('¡Perfil actualizado! ✨');
    },
    onError: () => toast.error('Error al actualizar el perfil.'),
  });

  /* ─── Edit handler: fetch details first ─── */
  async function handleEditClick(game: GameSummary) {
    try {
      const details = await gamesApi.getById(game.id);
      setModal({ type: 'edit', gameDetails: details });
    } catch {
      toast.error('No se pudieron cargar los detalles del juego.');
    }
  }

  /* ─── Derived data ─── */
  const filteredAndSorted = useMemo(() => {
    let result = [...games]; // Clone
    if (statusFilter !== 'All') {
      result = result.filter(g => g.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    switch (sortOption) {
      case 'percent-desc':
        result.sort((a, b) => (b.trophyPercentage || 0) - (a.trophyPercentage || 0));
        break;
      case 'percent-asc':
        result.sort((a, b) => (a.trophyPercentage || 0) - (b.trophyPercentage || 0));
        break;
      case 'diff-desc':
        result.sort((a, b) => (b.difficultyRating || 0) - (a.difficultyRating || 0));
        break;
      case 'diff-asc':
        result.sort((a, b) => (a.difficultyRating || 0) - (b.difficultyRating || 0));
        break;
      case 'hours-desc':
        result.sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0));
        break;
      case 'recent':
      default:
        result.sort((a, b) => b.id - a.id);
        break;
    }

    return result;
  }, [games, statusFilter, search, sortOption]);

  const platinumedCount = games.filter(g => g.status === 'Platinumed').length;
  const ratedGames      = games.filter(g => g.difficultyRating != null);
  const avgRating       = ratedGames.length
    ? (ratedGames.reduce((s, g) => s + (g.difficultyRating ?? 0), 0) / ratedGames.length).toFixed(1)
    : '—';
  const totalHours      = games.reduce((acc, g) => acc + (g.hoursPlayed || 0), 0);

  /* ─── Status tab counts ─── */
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { All: games.length };
    GAME_STATUSES.forEach(s => {
      counts[s.value] = games.filter(g => g.status === s.value).length;
    });
    return counts;
  }, [games]);

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-surface-900">
      <Header 
        onAddGame={() => setModal({ type: 'create' })} 
        onEditProfile={() => setIsProfileEditModalOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Juegos',         value: games.length, icon: Gamepad2, color: 'text-violet-400' },
            { label: 'Horas Totales',   value: `${totalHours}h`, icon: Clock,    color: 'text-emerald-400' },
            { label: 'Dificultad Media', value: avgRating,    icon: Star,     color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="glass flex items-center gap-4 rounded-2xl px-5 py-4 animate-fade-in">
              <div className={`rounded-xl bg-white/5 p-2.5 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platinum banner */}
        {platinumedCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-yellow-400/5 px-5 py-3 animate-fade-in">
            <span className="text-2xl">🏆</span>
            <p className="text-sm text-amber-300">
              <span className="font-bold">{platinumedCount}</span> juego{platinumedCount !== 1 ? 's' : ''} platinado{platinumedCount !== 1 ? 's' : ''} — ¡Cazador de trofeos de élite!
            </p>
          </div>
        )}

        {/* Status filter tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                  : 'border-white/8 bg-white/4 text-slate-400 hover:bg-white/8 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none">{tab.emoji}</span>
              {tab.label}
              <span className={`ml-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                statusFilter === tab.value ? 'bg-amber-500/20 text-amber-200' : 'bg-white/6 text-slate-500'
              }`}>
                {countByStatus[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar juegos…"
              className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <ListFilter size={13} />
              <span>Ordenar por</span>
            </div>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-xl border border-white/10 bg-white/5 py-2 pl-3 pr-8 text-sm text-white outline-none appearance-none cursor-pointer focus:border-amber-500 hover:bg-white/10 transition-colors"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#1e1e38]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Grid */}
        {gamesLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <EmptyState
            hasFilter={sortOption !== 'recent' || search !== '' || statusFilter !== 'All'}
            onAddGame={() => setModal({ type: 'create' })}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSorted.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onEdit={handleEditClick}
                onDelete={g => setModal({ type: 'delete', game: g })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {modal.type === 'create' && (
        <GameModal
          title="Registrar Hunt"
          isSubmitting={createMut.isPending}
          onSubmit={p => createMut.mutate(p)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'edit' && (
        <GameModal
          title="Editar Juego"
          initialData={modal.gameDetails}
          isSubmitting={updateMut.isPending}
          onSubmit={p => updateMut.mutate({ id: modal.gameDetails.id, payload: p })}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteModal
          gameName={modal.game.name}
          isDeleting={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(modal.game.id)}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}

      {profile && (
        <ProfileEditModal
          isOpen={isProfileEditModalOpen}
          profile={profile}
          onClose={() => setIsProfileEditModalOpen(false)}
          onSave={async p => {
            await updateProfileMut.mutateAsync(p);
          }}
        />
      )}
    </div>
  );
}
