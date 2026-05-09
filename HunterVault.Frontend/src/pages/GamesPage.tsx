import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Trophy, Gamepad2, Clock, ListFilter, Zap, Users, Info } from 'lucide-react';
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
import { XpInfoModal } from '../components/XpInfoModal';
import { SocialSidebar } from '../components/SocialSidebar';
import { calculateGameXp, playXpGainSound, playLevelUpSound } from '../utils/xp';

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; gameDetails: GameDetails }
  | { type: 'delete'; game: GameSummary };

type StatusFilter = 'All' | GameStatus;

const STATUS_TABS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: 'All',         label: 'TODOS',      dot: 'bg-signal-400' },
  { value: 'Backlog',     label: 'PENDING',    dot: 'bg-slate-400' },
  { value: 'Playing',     label: 'ACTIVE',     dot: 'bg-pulse-400 animate-pulse' },
  { value: 'Completed',   label: 'CLEARED',    dot: 'bg-signal-400' },
  { value: 'Platinumed',  label: 'PLATINUM',   dot: 'bg-power-400' },
  { value: 'Dropped',     label: 'ABORTED',    dot: 'bg-alert-400' },
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
  const [isXpInfoModalOpen, setIsXpInfoModalOpen] = useState(false);
  const [sortOption, setSortOption]           = useState<SortOption>('recent');
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatus]             = useState<StatusFilter>('All');
  const [isSocialOpen, setIsSocialOpen]       = useState(false);

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
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['profile', user?.username] });
      
      // Calculate XP gain
      const gainedXp = calculateGameXp(payload);
      if (gainedXp > 0) {
        const isLevelUp = profile && (profile.totalXp + gainedXp >= profile.nextLevelXp);
        
        if (isLevelUp) {
          playLevelUpSound();
          toast.success(`¡NIVEL ${profile.level + 1} ALCANZADO! 🎊`, {
            duration: 5000,
            style: {
              background: 'linear-gradient(to right, #b45309, #d97706)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }
          });
        } else {
          playXpGainSound();
        }

        toast.success(`+${gainedXp.toLocaleString()} XP`, {
          icon: '✨',
          duration: 3000,
          style: {
            background: '#1e1e38',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            fontWeight: 'bold'
          }
        });
      }

      setModal({ type: 'none' });
      toast.success('¡Hunt registrado! 🏆');
    },
    onError: () => toast.error('Error al registrar el hunt.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateGamePayload }) =>
      gamesApi.update(id, payload),
    onSuccess: (_, { payload }) => {
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['profile', user?.username] });
      
      // Calculate XP gain (difference)
      if (modal.type === 'edit') {
        const oldXp = calculateGameXp(modal.gameDetails);
        const newXp = calculateGameXp(payload);
        const diff = newXp - oldXp;

        if (diff > 0) {
          const isLevelUp = profile && (profile.totalXp + diff >= profile.nextLevelXp);

          if (isLevelUp) {
            playLevelUpSound();
            toast.success(`¡NIVEL ${profile.level + 1} ALCANZADO! 🎊`, {
              duration: 5000,
              style: {
                background: 'linear-gradient(to right, #b45309, #d97706)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }
            });
          } else {
            playXpGainSound();
          }

          toast.success(`+${diff.toLocaleString()} XP`, {
            icon: '✨',
            duration: 3000,
            style: {
              background: '#1e1e38',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              fontWeight: 'bold'
            }
          });
        }
      }

      setModal({ type: 'none' });
      toast.success('¡Juego actualizado!');
    },
    onError: () => toast.error('Error al actualizar el juego.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => gamesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['profile', user?.username] });
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
  const STAT_CARDS = [
    { key: 'games', label: 'JUEGOS', code: 'VAULT.SIZE',     value: games.length,                              icon: Gamepad2, glow: 'glow-signal',  accent: 'text-signal-300', border: 'border-signal-400/40' },
    { key: 'level', label: 'NIVEL',  code: 'HUNTER.RANK',    value: profile?.level ?? 1,                       icon: Trophy,   glow: 'glow-power',   accent: 'text-power-300',  border: 'border-power-300/40', extra: true },
    { key: 'xp',    label: 'XP',     code: 'POWER.CORE',     value: (profile?.totalXp ?? 0).toLocaleString(),  icon: Zap,      glow: 'glow-power',   accent: 'text-power-300',  border: 'border-power-300/40' },
    { key: 'hours', label: 'HORAS',  code: 'PLAYTIME.LOG',   value: `${totalHours}h`,                           icon: Clock,    glow: 'glow-pulse',   accent: 'text-pulse-300',  border: 'border-pulse-400/40' },
  ];

  const xpProgressPct = profile && profile.nextLevelXp > 0
    ? Math.min(100, Math.max(0, (profile.totalXp / profile.nextLevelXp) * 100))
    : 0;

  return (
    <div className="min-h-screen">
      <Header
        onAddGame={() => setModal({ type: 'create' })}
        onEditProfile={() => setIsProfileEditModalOpen(true)}
      />

      <SocialSidebar isOpen={isSocialOpen} onToggle={() => setIsSocialOpen(!isSocialOpen)} />

      <main className={`mx-auto max-w-7xl px-6 py-8 transition-all duration-300 ${isSocialOpen ? 'mr-80' : ''}`}>

        {/* HUD section header */}
        <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-hud text-signal-400/80">
          <span className="h-px w-8 bg-signal-400/60" />
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-pulse-400 animate-pulse" />
            VAULT_DASHBOARD · {user?.username?.toUpperCase() ?? 'HUNTER'}
          </span>
          <span className="h-px flex-1 bg-signal-400/20" />
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STAT_CARDS.map((stat, i) => (
            <div
              key={stat.key}
              className={`hud-clip hud-panel-bordered relative overflow-hidden p-4 animate-fade-in transition-transform hover:-translate-y-1 ${stat.border}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-[9px] uppercase tracking-hud text-signal-400/70">// {stat.code}</span>
                <stat.icon size={14} className={stat.accent} />
              </div>
              <div className="flex items-end gap-2">
                <p className={`font-display text-3xl font-bold leading-none text-white ${stat.glow ? '' : ''}`}>
                  {stat.value}
                </p>
                {stat.extra && (
                  <button
                    onClick={() => setIsXpInfoModalOpen(true)}
                    className="mb-1 text-signal-400/60 transition-colors hover:text-signal-300"
                    title="Sistema de XP"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
              <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-hud text-slate-400">{stat.label}</p>

              {/* XP progress bar inside the LEVEL card */}
              {stat.key === 'level' && profile && (
                <div className="mt-3">
                  <div className="relative h-1 w-full overflow-hidden bg-surface-800 border border-power-300/15">
                    <div
                      className="h-full bg-gradient-to-r from-power-400 to-power-200 transition-all duration-700"
                      style={{ width: `${xpProgressPct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[8px] tracking-hud text-slate-500">
                    <span>{profile.totalXp.toLocaleString()}</span>
                    <span>/{profile.nextLevelXp.toLocaleString()} XP</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="mb-5 flex items-center gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-hud text-signal-400/70 sm:block">// FILTRO</span>
          <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`hud-clip-sm group/tab flex shrink-0 items-center gap-2 border px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-hud transition-all
                  ${statusFilter === tab.value
                    ? 'border-signal-400/70 bg-signal-400/15 text-signal-200 glow-signal'
                    : 'border-signal-400/15 bg-void/40 text-slate-400 hover:border-signal-400/40 hover:text-slate-100 hover:bg-signal-400/5'
                  }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                {tab.label}
                <span className={`font-mono text-[10px] tracking-normal ${statusFilter === tab.value ? 'text-signal-300' : 'text-slate-500 group-hover/tab:text-slate-300'}`}>
                  [{countByStatus[tab.value] ?? 0}]
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-signal-400/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="QUERY > buscar título…"
              className="hud-input hud-clip-sm w-full py-2.5 pl-10 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSocialOpen(!isSocialOpen)}
              className={`hud-clip-sm flex h-10 items-center gap-2 border px-4 font-display text-[11px] font-bold uppercase tracking-hud transition-all
                ${isSocialOpen
                  ? 'border-signal-400/70 bg-signal-400/15 text-signal-200 glow-signal'
                  : 'border-signal-400/20 bg-signal-400/5 text-slate-400 hover:border-signal-400/50 hover:text-signal-300'
                }`}
            >
              <Users size={14} />
              <span className="hidden sm:inline">COMMS</span>
            </button>

            <div className="hud-clip-sm flex items-center gap-2 border border-signal-400/20 bg-signal-400/5 pl-3">
              <ListFilter size={13} className="text-signal-400/70" />
              <span className="font-display text-[10px] font-bold uppercase tracking-hud text-signal-400/70">SORT</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="hud-input border-0 bg-transparent !shadow-none py-2.5 pl-1 pr-8 font-display text-[11px] font-semibold uppercase tracking-hud text-white"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-surface-900 normal-case font-sans">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section divider — diagonal stripes */}
        <div className="mb-6 flex items-center gap-3">
          <div className="hud-stripes h-3 w-12 hud-clip-sm" />
          <span className="font-mono text-[10px] uppercase tracking-hud text-signal-400/60">
            VAULT.GAMES [{filteredAndSorted.length} / {games.length}]
          </span>
          <div className="h-px flex-1 bg-signal-400/15" />
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

      <XpInfoModal
        isOpen={isXpInfoModalOpen}
        onClose={() => setIsXpInfoModalOpen(false)}
      />
    </div>
  );
}
