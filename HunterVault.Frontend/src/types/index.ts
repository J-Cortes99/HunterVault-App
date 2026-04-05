export type GameStatus = 'Backlog' | 'Playing' | 'Completed' | 'Platinumed' | 'Dropped';

export const GAME_STATUSES: { value: GameStatus; label: string; emoji: string }[] = [
  { value: 'Backlog', label: 'Pendiente', emoji: '📋' },
  { value: 'Playing', label: 'Jugando', emoji: '🎮' },
  { value: 'Completed', label: 'Completado', emoji: '✅' },
  { value: 'Platinumed', label: 'Platinado', emoji: '🏆' },
  { value: 'Dropped', label: 'Abandonado', emoji: '❌' },
];

export const PLATFORMS = ['PC', 'PS5', 'Switch', 'Xbox'] as const;
export type Platform = typeof PLATFORMS[number];

export interface GameSummary {
  id: number;
  name: string;
  genres: string[];
  platform: string;
  status: GameStatus;
  hoursPlayed?: number;
  difficultyRating?: number;
  trophyPercentage?: number;
  coverUrl?: string;
  review?: string;
  igdbId?: number;
}

export interface GameDetails {
  id: number;
  name: string;
  genres: string[];
  platform: string;
  status: GameStatus;
  hoursPlayed?: number;
  difficultyRating?: number;
  trophyPercentage?: number;
  coverUrl?: string;
  review?: string;
  igdbId?: number;
}

export interface CreateGamePayload {
  name: string;

  platform: string;
  status: GameStatus;
  hoursPlayed?: number;
  difficultyRating?: number;
  trophyPercentage?: number;
  coverUrl?: string;
  review?: string;
  igdbId?: number;
}

export type UpdateGamePayload = CreateGamePayload;

export interface IgdbSearchResult {
  id: number;
  name: string;
  coverUrl?: string;
}

export interface Genre {
  name: string;
}
