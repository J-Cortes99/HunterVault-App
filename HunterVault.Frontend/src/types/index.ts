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
}

export type UpdateGamePayload = CreateGamePayload;

export interface IgdbSearchResult {
  name: string;
  coverUrl?: string;
}
