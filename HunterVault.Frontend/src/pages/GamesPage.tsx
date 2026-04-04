import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Layers, Star, Gamepad2 } from 'lucide-react';
import type { GameSummary, GameDetails, CreateGamePayload, GameStatus } from '../types';
import { GAME_STATUSES } from '../types';
import { gamesApi } from '../api/games';
import { genresApi } from '../api/genres';
import { Header } from '../components/Header';
import { GameCard } from '../components/GameCard';
import { GenreFilter } from '../components/GenreFilter';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { GameModal } from '../components/GameModal';
import { DeleteModal } from '../components/DeleteModal';

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

export function GamesPage() {
  const qc = useQueryClient();
  const [modal, setModal]           = useState<ModalState>({ type: 'none' });
  const [selectedGenre, setGenre]   = useState<number | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<StatusFilter>('All');

  /* ─── Queries ─── */
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: gamesApi.getAll,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: genresApi.getAll,
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
  const filtered = useMemo(() => {
    let result = games;
    if (statusFilter !== 'All') {
      result = result.filter(g => g.status === statusFilter);
    }
    if (selectedGenre !== null) {
      const genreName = genres.find(g => g.id === selectedGenre)?.name ?? '';
      result = result.filter(g => g.genre === genreName);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }
    return result;
  }, [games, genres, statusFilter, selectedGenre, search]);

  const platinumedCount = games.filter(g => g.status === 'Platinumed').length;
  const ratedGames      = games.filter(g => g.difficultyRating != null);
  const avgRating       = ratedGames.length
    ? (ratedGames.reduce((s, g) => s + (g.difficultyRating ?? 0), 0) / ratedGames.length).toFixed(1)
    : '—';

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
    <div className="min-h-screen bg-[#0f0f1a]">
      <Header onAddGame={() => setModal({ type: 'create' })} />

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Juegos',    value: games.length,    icon: Gamepad2, color: 'text-violet-400' },
            { label: 'Géneros',   value: genres.length,   icon: Layers, color: 'text-sky-400'   },
            { label: 'Dificultad Media',value: avgRating,        icon: Star,   color: 'text-red-400'},
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

          {/* Genre filter */}
          <GenreFilter
            genres={genres}
            selected={selectedGenre}
            onChange={setGenre}
          />
        </div>

        {/* Grid */}
        {gamesLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilter={selectedGenre !== null || search !== '' || statusFilter !== 'All'}
            onAddGame={() => setModal({ type: 'create' })}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(game => (
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
          genres={genres}
          isSubmitting={createMut.isPending}
          onSubmit={p => createMut.mutate(p)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'edit' && (
        <GameModal
          title="Editar Juego"
          genres={genres}
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
    </div>
  );
}
