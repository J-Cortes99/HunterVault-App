import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../api/client';
import { createDemoState, toSummary, DEMO_USERNAME, type DemoState } from './seed';
import { buildDemoJwt } from './jwt';
import { calculateGameXp } from '../utils/xp';
import type {
  CreateGamePayload,
  GameDetails,
  GameStatus,
  UpdateProfilePayload,
} from '../types';

let state: DemoState | null = null;
let originalAdapter: AxiosAdapter | undefined;

const ok = <T>(data: T, config: InternalAxiosRequestConfig, status = 200): AxiosResponse<T> => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
});

const notFound = (config: InternalAxiosRequestConfig): AxiosResponse =>
  ok({ message: 'Not found in demo' }, config, 404);

function recomputeProfile() {
  if (!state) return;
  let totalXp = 0;
  for (const g of state.games) totalXp += calculateGameXp(g);
  const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 100)));
  const nextLevelXp = ((level + 1) ** 2) * 100;

  state.profile = {
    ...state.profile,
    level,
    totalXp,
    nextLevelXp,
    totalGames: state.games.length,
    games: state.games.map(toSummary),
  };
}

function normalizeTrophy(status: GameStatus, raw?: number): number | undefined {
  if (status === 'Platinumed') return 100;
  if (status === 'Backlog' || status === 'Dropped') return undefined;
  return raw;
}

function pushFeed(game: GameDetails) {
  if (!state) return;
  state.feed.unshift({
    id: Date.now(),
    name: game.name,
    status: game.status,
    trophyPercentage: game.trophyPercentage,
    updatedAt: new Date().toISOString(),
    user: {
      username: state.profile.username,
      avatarUrl: state.profile.avatarUrl,
    },
  });
  state.feed = state.feed.slice(0, 30);
}

function parseBody<T>(config: InternalAxiosRequestConfig): T {
  const raw = config.data;
  if (!raw) return {} as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return {} as T; }
  }
  return raw as T;
}

function pathOf(config: InternalAxiosRequestConfig): { path: string; query: URLSearchParams } {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  const full = url.startsWith('http') ? url : `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  const u = new URL(full, 'http://demo.local');
  let path = u.pathname.toLowerCase();
  // strip baseURL prefix if present
  try {
    const baseU = new URL(base, 'http://demo.local');
    if (path.startsWith(baseU.pathname.toLowerCase())) {
      path = path.slice(baseU.pathname.toLowerCase().length) || '/';
    }
  } catch { /* noop */ }
  if (!path.startsWith('/')) path = '/' + path;
  return { path, query: u.searchParams };
}

const demoAdapter: AxiosAdapter = async (config) => {
  if (!state) state = createDemoState();
  const { path, query } = pathOf(config);
  const method = (config.method ?? 'get').toLowerCase();

  // ── Auth ─────────────────────────────────────────────────────────────
  if (path === '/auth/login' || path === '/auth/refresh') {
    const token = buildDemoJwt();
    return ok({ accessToken: token, refreshToken: 'demo-refresh' }, config);
  }
  if (path === '/auth/check-username') {
    return ok({ available: true }, config);
  }
  if (path === '/auth/register' || path === '/auth/verify-email'
      || path === '/auth/forgot-password' || path === '/auth/reset-password') {
    return ok({ message: 'Demo: registro/email deshabilitado' }, config);
  }

  // ── Genres ───────────────────────────────────────────────────────────
  if (path === '/genres' && method === 'get') {
    return ok(state.genres, config);
  }

  // ── Games ────────────────────────────────────────────────────────────
  if (path === '/games' && method === 'get') {
    return ok(state.games.map(toSummary), config);
  }
  if (path === '/games' && method === 'post') {
    const body = parseBody<CreateGamePayload>(config);
    const game: GameDetails = {
      id: state.nextGameId++,
      name: body.name,
      genres: [],
      platform: body.platform,
      status: body.status,
      hoursPlayed: body.hoursPlayed,
      difficultyRating: body.difficultyRating,
      trophyPercentage: normalizeTrophy(body.status, body.trophyPercentage),
      coverUrl: body.coverUrl,
      review: body.review,
      igdbId: body.igdbId,
    };
    state.games.unshift(game);
    pushFeed(game);
    recomputeProfile();
    return ok(game, config, 201);
  }

  const gameIdMatch = path.match(/^\/games\/(\d+)$/);
  if (gameIdMatch) {
    const id = Number(gameIdMatch[1]);
    const idx = state.games.findIndex(g => g.id === id);
    if (idx === -1) return notFound(config);
    if (method === 'get') return ok(state.games[idx], config);
    if (method === 'put') {
      const body = parseBody<CreateGamePayload>(config);
      const updated: GameDetails = {
        ...state.games[idx],
        name: body.name,
        platform: body.platform,
        status: body.status,
        hoursPlayed: body.hoursPlayed,
        difficultyRating: body.difficultyRating,
        trophyPercentage: normalizeTrophy(body.status, body.trophyPercentage),
        coverUrl: body.coverUrl ?? state.games[idx].coverUrl,
        review: body.review,
        igdbId: body.igdbId ?? state.games[idx].igdbId,
      };
      state.games[idx] = updated;
      pushFeed(updated);
      recomputeProfile();
      return ok(updated, config);
    }
    if (method === 'delete') {
      state.games.splice(idx, 1);
      recomputeProfile();
      return ok({ message: 'deleted' }, config, 204);
    }
  }

  // ── Profile ──────────────────────────────────────────────────────────
  if (path === '/profile/feed' && method === 'get') {
    const page = Number(query.get('page') ?? '1');
    const size = Number(query.get('pageSize') ?? '10');
    const start = (page - 1) * size;
    return ok(state.feed.slice(start, start + size), config);
  }
  if (path === '/profile/recommended' && method === 'get') {
    return ok(state.recommended, config);
  }
  if (path === '/profile/search' && method === 'get') {
    const q = (query.get('query') ?? '').toLowerCase();
    const results = q
      ? state.recommended.filter(u => u.username.toLowerCase().includes(q))
      : state.recommended;
    return ok(results, config);
  }
  if (path === '/profile' && method === 'put') {
    const body = parseBody<UpdateProfilePayload>(config);
    state.profile = {
      ...state.profile,
      bio: body.bio ?? state.profile.bio,
      avatarUrl: body.avatarUrl ?? state.profile.avatarUrl,
      bannerUrl: body.bannerUrl ?? state.profile.bannerUrl,
    };
    return ok({ message: 'profile updated' }, config);
  }
  const followMatch = path.match(/^\/profile\/follow\/([0-9a-f-]+)$/i);
  if (followMatch) {
    const targetId = followMatch[1];
    const target = state.recommended.find(u => u.id === targetId);
    if (target) target.isFollowing = method === 'post';
    return ok({ message: method === 'post' ? 'followed' : 'unfollowed' }, config);
  }
  const profileMatch = path.match(/^\/profile\/(.+)$/);
  if (profileMatch && method === 'get') {
    const username = decodeURIComponent(profileMatch[1]);
    if (username.toLowerCase() === DEMO_USERNAME.toLowerCase()) {
      recomputeProfile();
      return ok(state.profile, config);
    }
    // Public profile of a fake follower — synthesize something reasonable
    const fake = state.recommended.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (fake) {
      return ok({
        username: fake.username,
        bio: 'Perfil público de demostración',
        avatarUrl: fake.avatarUrl,
        bannerUrl: undefined,
        level: fake.level,
        totalXp: fake.level * fake.level * 100,
        nextLevelXp: (fake.level + 1) * (fake.level + 1) * 100,
        totalGames: 0,
        games: [],
      }, config);
    }
    return notFound(config);
  }

  // ── IGDB ─────────────────────────────────────────────────────────────
  if (path === '/igdb/search' && method === 'get') {
    const q = (query.get('q') ?? '').toLowerCase();
    const results = q
      ? state.igdbSearch.filter(g => g.name.toLowerCase().includes(q))
      : state.igdbSearch;
    return ok(results, config);
  }
  const igdbDetails = path.match(/^\/igdb\/details\/id\/(\d+)$/);
  if (igdbDetails) {
    const id = Number(igdbDetails[1]);
    const seed = state.igdbSearch.find(g => g.id === id) ?? state.igdbSearch[0];
    return ok({
      id: seed.id,
      name: seed.name,
      summary: 'Detalles de demostración. En producción esto viene de la API de IGDB.',
      coverUrl: seed.coverUrl,
      rating: 88,
      firstReleaseDate: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365,
      genres: ['RPG', 'Adventure'],
      platforms: ['PC', 'PS5'],
      screenshots: [],
      normally: 60,
      hastily: 35,
      completely: 120,
      trailerYoutubeId: null,
    }, config);
  }

  return notFound(config);
};

export function isDemoActive(): boolean {
  return localStorage.getItem('demoMode') === 'true';
}

export function installDemoAdapter() {
  if (originalAdapter) return; // already installed
  originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
  apiClient.defaults.adapter = demoAdapter;
  if (!state) state = createDemoState();
  localStorage.setItem('demoMode', 'true');
}

export function uninstallDemoAdapter() {
  if (originalAdapter !== undefined) {
    apiClient.defaults.adapter = originalAdapter;
    originalAdapter = undefined;
  } else {
    apiClient.defaults.adapter = undefined;
  }
  state = null;
  localStorage.removeItem('demoMode');
}

export function getDemoState(): DemoState | null {
  return state;
}
