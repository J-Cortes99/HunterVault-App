import { apiClient } from './client';

export interface IgdbGameDetails {
  id: number;
  name: string;
  summary: string;
  coverUrl: string | null;
  rating: number | null;
  firstReleaseDate: number | null;
  genres: string[];
  platforms: string[];
  screenshots: string[];
  normally: number | null;
  hastily: number | null;
  completely: number | null;
  trailerYoutubeId: string | null;
}

export const igdbApi = {
  searchGames: async (query: string) => {
    const res = await apiClient.get('/igdb/search', { params: { q: query } });
    return res.data;
  },

  getDetailsById: async (id: number): Promise<IgdbGameDetails> => {
    const res = await apiClient.get(`/igdb/details/id/${id}`);
    return res.data;
  },
};
