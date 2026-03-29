import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, TrendingUp, Layers, Coins } from 'lucide-react';
import type { GameSummary, GameDetails, CreateGamePayload } from '../types';
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

export function GamesPage() {
  const qc = useQueryClient();
  const [modal, setModal]           = useState<ModalState>({ type: 'none' });
  const [selectedGenre, setGenre]   = useState<number | null>(null);
  const [search, setSearch]         = useState('');

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
      toast.success('Game added successfully!');
    },
    onError: () => toast.error('Failed to add game.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateGamePayload }) =>
      gamesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      setModal({ type: 'none' });
      toast.success('Game updated!');
    },
    onError: () => toast.error('Failed to update game.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => gamesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      setModal({ type: 'none' });
      toast.success('Game deleted.');
    },
    onError: () => toast.error('Failed to delete game.'),
  });

  /* ─── Edit handler: fetch details first ─── */
  async function handleEditClick(game: GameSummary) {
    try {
      const details = await gamesApi.getById(game.id);
      setModal({ type: 'edit', gameDetails: details });
    } catch {
      toast.error('Could not load game details.');
    }
  }

  /* ─── Derived data ─── */
  const filtered = useMemo(() => {
    let result = games;
    if (selectedGenre !== null) {
      const genreName = genres.find(g => g.id === selectedGenre)?.name ?? '';
      result = result.filter(g => g.genre === genreName);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }
    return result;
  }, [games, genres, selectedGenre, search]);

  const avgPrice = games.length
    ? (games.reduce((s, g) => s + g.price, 0) / games.length).toFixed(2)
    : '0.00';

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Header onAddGame={() => setModal({ type: 'create' })} />

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Games', value: games.length, icon: TrendingUp, color: 'text-violet-400' },
            { label: 'Genres',      value: genres.length, icon: Layers,     color: 'text-sky-400' },
            { label: 'Avg. Price',  value: `$${avgPrice}`, icon: Coins, color: 'text-emerald-400' },
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

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search games…"
              className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
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
            hasFilter={selectedGenre !== null || search !== ''}
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
          title="Add New Game"
          genres={genres}
          isSubmitting={createMut.isPending}
          onSubmit={p => createMut.mutate(p)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'edit' && (
        <GameModal
          title="Edit Game"
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
