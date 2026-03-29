export interface Genre {
  id: number;
  name: string;
}

export interface GameSummary {
  id: number;
  name: string;
  genre: string;
  price: number;
  releaseDate: string; // "YYYY-MM-DD"
}

export interface GameDetails {
  id: number;
  name: string;
  genreId: number;
  price: number;
  releaseDate: string;
}

export interface CreateGamePayload {
  name: string;
  genreId: number;
  price: number;
  releaseDate: string;
}

export type UpdateGamePayload = CreateGamePayload;
