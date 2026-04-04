import { apiClient } from './client';
import type { IgdbSearchResult } from '../types';

export const igdbApi = {
  searchGames: async (query: string): Promise<IgdbSearchResult[]> => {
    if (!query || query.length < 2) return [];
    const response = await apiClient.get<IgdbSearchResult[]>('/igdb/search', {
      params: { q: query },
    });
    return response.data;
  },
};
