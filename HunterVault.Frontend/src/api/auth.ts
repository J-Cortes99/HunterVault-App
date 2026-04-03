import { apiClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/Auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post('/Auth/register', data).then(r => r.data),

  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<TokenResponse>('/Auth/refresh', data).then(r => r.data),
};
