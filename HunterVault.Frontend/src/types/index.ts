export type GameStatus = 'Backlog' | 'Playing' | 'Completed' | 'Platinumed' | 'Dropped';
export type GameFormat = 'Digital' | 'Physical';

export const GAME_STATUSES: { value: GameStatus; label: string; emoji: string }[] = [
  { value: 'Backlog', label: 'Pendiente', emoji: '📋' },
  { value: 'Playing', label: 'Jugando', emoji: '🎮' },
  { value: 'Completed', label: 'Completado', emoji: '✅' },
  { value: 'Platinumed', label: 'Platinado', emoji: '🏆' },
  { value: 'Dropped', label: 'Abandonado', emoji: '❌' },
];

export const PLATFORMS = ['PC', 'PS5', 'Switch', 'Retro'] as const;
export type Platform = typeof PLATFORMS[number];

export const FORMATS: { value: GameFormat; label: string }[] = [
  { value: 'Digital', label: 'Digital' },
  { value: 'Physical', label: 'Físico' },
];

export interface Genre {
  id: number;
  name: string;
}

export interface GameSummary {
  id: number;
  name: string;
  genre: string;
  completionDate?: string; // "YYYY-MM-DD"
  platform: string;
  status: GameStatus;
  format: GameFormat;
  hoursPlayed?: number;
  difficultyRating?: number;
  trophyPercentage?: number;
  coverUrl?: string;
  review?: string;
}

export interface GameDetails {
  id: number;
  name: string;
  genreId: number;
  completionDate?: string;
  platform: string;
  status: GameStatus;
  format: GameFormat;
  hoursPlayed?: number;
  difficultyRating?: number;
  trophyPercentage?: number;
  coverUrl?: string;
  review?: string;
}

export interface CreateGamePayload {
  name: string;
  genreId: number;
  completionDate?: string;
  platform: string;
  status: GameStatus;
  format: GameFormat;
  hoursPlayed?: number;
  difficultyRating?: number;
  trophyPercentage?: number;
  coverUrl?: string;
  review?: string;
}

export type UpdateGamePayload = CreateGamePayload;
