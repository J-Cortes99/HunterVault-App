import { apiClient } from './client';
import type { GameSummary, GameDetails, CreateGamePayload, UpdateGamePayload } from '../types';

export const gamesApi = {
  getAll: () =>
    apiClient.get<GameSummary[]>('/games').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<GameDetails>(`/games/${id}`).then(r => r.data),

  create: (payload: CreateGamePayload) =>
    apiClient.post<GameDetails>('/games', payload).then(r => r.data),

  update: (id: number, payload: UpdateGamePayload) =>
    apiClient.put(`/games/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete(`/games/${id}`),
};
