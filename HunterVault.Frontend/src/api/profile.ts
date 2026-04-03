import { apiClient } from './client';
import type { GameSummary } from '../types';

export interface PublicProfile {
  username: string;
  totalGames: number;
  games: GameSummary[];
}

export const profileApi = {
  getByUsername: (username: string) =>
    apiClient.get<PublicProfile>(`/profile/${username}`).then(r => r.data),
};
