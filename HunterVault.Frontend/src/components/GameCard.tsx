import { useNavigate } from 'react-router-dom';
import { Clock, Pencil, Star, Trash2, Gamepad, Trophy } from 'lucide-react';
import { FaWindows, FaPlaystation, FaXbox } from 'react-icons/fa6';
import { BsNintendoSwitch } from 'react-icons/bs';
import type { GameSummary, GameStatus } from '../types';

interface GameCardProps {
  game: GameSummary;
  onEdit: (game: GameSummary) => void;
  onDelete: (game: GameSummary) => void;
}

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

const PLATFORM_COLORS: Record<string, string> = {
  PC:     'text-sky-300 border-sky-400/40 bg-sky-500/10',
  PS5:    'text-blue-300 border-blue-400/40 bg-blue-500/10',
  Switch: 'text-alert-300 border-alert-400/40 bg-alert-400/10',
  Xbox:   'text-pulse-300 border-pulse-400/40 bg-pulse-400/10',
};

const STATUS_STYLES: Record<GameStatus, { label: string; tag: string; dot: string }> = {
  Backlog:    { label: 'PENDING',    tag: 'border-slate-400/40 bg-slate-500/15 text-slate-200',         dot: 'bg-slate-400' },
  Playing:    { label: 'ACTIVE',     tag: 'border-pulse-400/50 bg-pulse-400/15 text-pulse-300',         dot: 'bg-pulse-400 animate-pulse' },
  Completed:  { label: 'CLEARED',    tag: 'border-signal-400/50 bg-signal-400/15 text-signal-300',      dot: 'bg-signal-400' },
  Platinumed: { label: 'PLATINUM',   tag: 'border-power-300/60 bg-power-400/20 text-power-200',         dot: 'bg-power-400' },
  Dropped:    { label: 'ABORTED',    tag: 'border-alert-400/50 bg-alert-500/15 text-alert-300',         dot: 'bg-alert-400' },
};

const DEFAULT_BADGE = 'border-slate-400/40 bg-slate-500/10 text-slate-300';
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

export function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[game.status] ?? STATUS_STYLES.Backlog;
  const isPlat = game.status === 'Platinumed';

  return (
    <article
      className={`
        hud-clip group relative flex flex-col overflow-hidden animate-fade-in
        transition-all duration-300 hover:-translate-y-1
        ${isPlat
          ? 'hud-panel-bordered hud-panel-power legendary-border'
          : 'hud-panel-bordered hover:[&::before]:opacity-100'
        }
      `}
    >
      {/* Animated platinum sheen */}
      {isPlat && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-power-200/30 to-transparent skew-x-[-20deg] animate-platinum-shine" />
        </div>
      )}

      {/* ── Cover ── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-900">
        {game.coverUrl ? (
          <>
            <img
              src={game.coverUrl}
              alt={game.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Top-down vignette to ground the badges */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/85 via-void/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void via-void/70 to-transparent" />
            {/* Subtle scan grid over cover */}
            <div className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,229,255,0.18) 0 1px, transparent 1px 4px)'
              }}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-800 text-surface-500">
            <Gamepad size={56} strokeWidth={1.2} />
          </div>
        )}

        {/* Status tag — top-left, HUD-tagged */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`hud-clip-tag inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-bold tracking-hud font-display backdrop-blur-md ${statusStyle.tag}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        </div>

        {/* Platform — top-right */}
        {game.platform && (
          <div className="absolute top-3 right-3 z-10">
            <span className={`flex h-7 w-7 items-center justify-center border backdrop-blur-md ${PLATFORM_COLORS[game.platform] ?? DEFAULT_PLATFORM}`}>
              <PlatformIcon platform={game.platform} />
            </span>
          </div>
        )}

        {/* Genres — bottom */}
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

      {/* ── Body ── */}
      <div className="relative flex flex-1 flex-col p-5 z-10">
        {/* HUD ID line */}
        <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-hud">
          <span className="text-signal-400/60">// VAULT_ID:{String(game.id).padStart(4, '0')}</span>
          {isPlat && (
            <span className="flex items-center gap-1 text-power-300 animate-data-blink">
              <Trophy size={9} /> LGNDRY
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => navigate(`/game/${game.igdbId}/${encodeURIComponent(game.name)}`)}
          className="font-display text-lg font-bold leading-tight text-white mb-3 cursor-pointer transition-colors group-hover:text-signal-300 line-clamp-2"
        >
          {game.name}
        </h3>

        {/* Stats grid — terminal data readout */}
        <div className="mb-4 grid grid-cols-2 gap-2 border-y border-signal-400/15 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold tracking-hud text-signal-400/70 font-display">DIFFICULTY</span>
            <div className="flex items-center gap-1.5">
              <Star size={11} className="text-power-400" fill="currentColor" />
              <span className="font-mono text-sm font-bold text-white">
                {game.difficultyRating ?? '--'}
                <span className="text-slate-500">/10</span>
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

        {/* Review */}
        {game.review && (
          <div className="mb-4">
            <span className="mb-1 block text-[9px] font-bold tracking-hud text-signal-400/70 font-display">// LOG_ENTRY</span>
            <p className="text-xs italic text-slate-300/90 line-clamp-2 border-l-2 border-signal-400/40 pl-3">
              {game.review}
            </p>
          </div>
        )}

        {/* Trophy progress */}
        {game.trophyPercentage != null && (
          <div className="mb-5">
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px] tracking-hud">
              <span className="text-signal-400/70 font-display">TROPHY_DATA</span>
              <span className={`font-bold ${isPlat ? 'text-power-300 text-glow-power' : 'text-signal-300'}`}>
                {game.trophyPercentage}%
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden bg-surface-800 border border-signal-400/15">
              <div
                className={`h-full transition-all duration-700 ${
                  isPlat
                    ? 'bg-gradient-to-r from-power-400 via-power-200 to-power-400 animate-shimmer'
                    : 'bg-gradient-to-r from-signal-500 to-signal-300'
                }`}
                style={{ width: `${game.trophyPercentage}%` }}
              />
              {/* tick marks */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(0,0,0,0.6) calc(10% - 1px) 10%)'
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={() => onEdit(game)}
            className="hud-clip-sm hud-btn-ghost group/btn flex flex-1 items-center justify-center gap-2 px-3 py-2 text-[11px]"
          >
            <Pencil size={12} className="transition-transform group-hover/btn:rotate-[-8deg]" />
            EDIT
          </button>
          <button
            onClick={() => onDelete(game)}
            className="hud-clip-sm flex aspect-square items-center justify-center px-3 py-2 text-slate-400 border border-alert-400/20 bg-alert-500/5 transition-all hover:border-alert-400/60 hover:text-alert-300 hover:bg-alert-500/15 hover:glow-alert"
            title="Eliminar"
            aria-label="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
