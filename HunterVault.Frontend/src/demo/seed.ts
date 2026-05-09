import type {
  GameSummary,
  GameDetails,
  UserProfile,
  UserSearchResult,
  ActivityFeedItem,
  Genre,
} from '../types';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_USERNAME = 'demo_hunter';

const cover = (slug: string) =>
  `https://images.igdb.com/igdb/image/upload/t_cover_big/${slug}.jpg`;

export interface DemoState {
  games: GameDetails[];
  profile: UserProfile;
  recommended: UserSearchResult[];
  feed: ActivityFeedItem[];
  igdbSearch: { id: number; name: string; coverUrl: string }[];
  genres: Genre[];
  nextGameId: number;
}

function buildInitialState(): DemoState {
  const games: GameDetails[] = [
    {
      id: 1, igdbId: 119171, name: 'Elden Ring',
      genres: ['RPG', 'Adventure'], platform: 'PS5', status: 'Platinumed',
      hoursPlayed: 132, difficultyRating: 9, trophyPercentage: 100,
      coverUrl: cover('co4jni'), review: 'Obra maestra. El platino es brutal pero adictivo.',
    },
    {
      id: 2, igdbId: 134548, name: "Baldur's Gate 3",
      genres: ['RPG'], platform: 'PC', status: 'Completed',
      hoursPlayed: 96, difficultyRating: 6, trophyPercentage: 78,
      coverUrl: cover('co670h'), review: 'GOTY merecido. Larian se ha salido.',
    },
    {
      id: 3, igdbId: 11133, name: 'Hollow Knight',
      genres: ['Metroidvania', 'Indie'], platform: 'Switch', status: 'Platinumed',
      hoursPlayed: 64, difficultyRating: 8, trophyPercentage: 100,
      coverUrl: cover('co93cr'), review: 'Pequeña joya. Path of Pain es masoquismo puro.',
    },
    {
      id: 4, igdbId: 1942, name: 'The Witcher 3: Wild Hunt',
      genres: ['RPG', 'Adventure'], platform: 'PC', status: 'Completed',
      hoursPlayed: 178, difficultyRating: 7, trophyPercentage: 92,
      coverUrl: cover('co1wyy'), review: 'Las expansiones son mejores que muchos juegos enteros.',
    },
    {
      id: 5, igdbId: 7331, name: 'Hades',
      genres: ['Roguelike', 'Indie'], platform: 'Switch', status: 'Platinumed',
      hoursPlayed: 88, difficultyRating: 7, trophyPercentage: 100,
      coverUrl: cover('co39vg'),
    },
    {
      id: 6, igdbId: 119388, name: 'Stray',
      genres: ['Adventure', 'Indie'], platform: 'PS5', status: 'Completed',
      hoursPlayed: 8, difficultyRating: 3, trophyPercentage: 95,
      coverUrl: cover('co5pjp'),
    },
    {
      id: 7, igdbId: 1877, name: 'Cyberpunk 2077',
      genres: ['RPG', 'Shooter'], platform: 'PC', status: 'Playing',
      hoursPlayed: 42, difficultyRating: 6, trophyPercentage: 38,
      coverUrl: cover('co7497'), review: 'Phantom Liberty lo redime por completo.',
    },
    {
      id: 8, igdbId: 113112, name: 'Persona 5 Royal',
      genres: ['JRPG'], platform: 'PS5', status: 'Playing',
      hoursPlayed: 71, difficultyRating: 5, trophyPercentage: 54,
      coverUrl: cover('co5non'),
    },
    {
      id: 9, igdbId: 25076, name: 'Red Dead Redemption 2',
      genres: ['Adventure', 'Action'], platform: 'PC', status: 'Backlog',
      difficultyRating: 6,
      coverUrl: cover('co1q1f'),
    },
    {
      id: 10, igdbId: 132000, name: 'Lies of P',
      genres: ['Soulslike', 'RPG'], platform: 'PS5', status: 'Backlog',
      difficultyRating: 8,
      coverUrl: cover('co6kfb'),
    },
    {
      id: 11, igdbId: 1029, name: 'Bloodborne',
      genres: ['Soulslike', 'RPG'], platform: 'PS5', status: 'Dropped',
      hoursPlayed: 14, difficultyRating: 9,
      coverUrl: cover('co1rba'), review: 'Lo dejé tras el tercer jefe. Volveré algún día.',
    },
    {
      id: 12, igdbId: 28540, name: 'Disco Elysium',
      genres: ['RPG', 'Indie'], platform: 'PC', status: 'Completed',
      hoursPlayed: 38, difficultyRating: 5, trophyPercentage: 84,
      coverUrl: cover('co1y6x'),
    },
  ];

  const profile: UserProfile = {
    username: DEMO_USERNAME,
    bio: 'Cazador de platinos · 100+ juegos catalogados · Soulslike enjoyer',
    avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hunter',
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&h=400&fit=crop',
    level: 0,
    totalXp: 0,
    nextLevelXp: 0,
    totalGames: games.length,
    games: games.map(toSummary),
  };

  const recommended: UserSearchResult[] = [
    { id: '00000000-0000-4000-8000-000000000002', username: 'trophy_queen',  avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=queen',  level: 42, isFollowing: true  },
    { id: '00000000-0000-4000-8000-000000000003', username: 'speedrun_dad',  avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dad',    level: 31, isFollowing: true  },
    { id: '00000000-0000-4000-8000-000000000004', username: 'jrpg_addict',   avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jrpg',   level: 28, isFollowing: false },
    { id: '00000000-0000-4000-8000-000000000005', username: 'indie_lover',   avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=indie',  level: 19, isFollowing: false },
  ];

  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const feed: ActivityFeedItem[] = [
    { id: 101, name: 'Elden Ring: Shadow of the Erdtree', status: 'Platinumed', trophyPercentage: 100, updatedAt: minsAgo(12),
      user: { username: 'trophy_queen', avatarUrl: recommended[0].avatarUrl } },
    { id: 102, name: 'Final Fantasy VII Rebirth',         status: 'Completed',  trophyPercentage: 87,  updatedAt: minsAgo(58),
      user: { username: 'jrpg_addict',  avatarUrl: recommended[2].avatarUrl } },
    { id: 103, name: 'Sekiro: Shadows Die Twice',         status: 'Playing',    trophyPercentage: 41,  updatedAt: minsAgo(180),
      user: { username: 'speedrun_dad', avatarUrl: recommended[1].avatarUrl } },
    { id: 104, name: 'Animal Well',                       status: 'Completed',  trophyPercentage: 100, updatedAt: minsAgo(420),
      user: { username: 'indie_lover',  avatarUrl: recommended[3].avatarUrl } },
    { id: 105, name: 'Balatro',                           status: 'Playing',    trophyPercentage: 62,  updatedAt: minsAgo(1440),
      user: { username: 'trophy_queen', avatarUrl: recommended[0].avatarUrl } },
  ];

  const igdbSearch = [
    { id: 1020,   name: 'Dark Souls III',           coverUrl: cover('co1vcf') },
    { id: 11133,  name: 'Hollow Knight: Silksong',  coverUrl: cover('co1rfi') },
    { id: 119171, name: 'Elden Ring',               coverUrl: cover('co4jni') },
    { id: 134548, name: "Baldur's Gate 3",          coverUrl: cover('co670h') },
    { id: 1029,   name: 'Bloodborne',               coverUrl: cover('co1rba') },
    { id: 7331,   name: 'Hades',                    coverUrl: cover('co39vg') },
  ];

  const genres: Genre[] = [
    { name: 'RPG' }, { name: 'Adventure' }, { name: 'Action' }, { name: 'Shooter' },
    { name: 'Metroidvania' }, { name: 'Roguelike' }, { name: 'Indie' }, { name: 'JRPG' },
    { name: 'Soulslike' }, { name: 'Strategy' }, { name: 'Puzzle' }, { name: 'Platformer' },
  ];

  return {
    games,
    profile,
    recommended,
    feed,
    igdbSearch,
    genres,
    nextGameId: games.length + 1,
  };
}

export function toSummary(g: GameDetails): GameSummary {
  return {
    id: g.id,
    name: g.name,
    genres: g.genres,
    platform: g.platform,
    status: g.status,
    hoursPlayed: g.hoursPlayed,
    difficultyRating: g.difficultyRating,
    trophyPercentage: g.trophyPercentage,
    coverUrl: g.coverUrl,
    review: g.review,
    igdbId: g.igdbId,
  };
}

export function createDemoState(): DemoState {
  return buildInitialState();
}
