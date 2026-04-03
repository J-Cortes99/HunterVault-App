import { apiClient } from './client';
import type { Genre } from '../types';

export const genresApi = {
  getAll: () =>
    apiClient.get<Genre[]>('/genres').then(r => r.data),
};
