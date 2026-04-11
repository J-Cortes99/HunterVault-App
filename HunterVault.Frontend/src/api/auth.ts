import { apiClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface RegisterResponse {
  requiresVerification?: boolean;
  email?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/Auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/Auth/register', data).then(r => r.data),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post('/Auth/verify-email', data).then(r => r.data),

  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<TokenResponse>('/Auth/refresh', data).then(r => r.data),

  checkUsername: (username: string) =>
    apiClient.get<{ available: boolean }>(`/Auth/check-username?username=${encodeURIComponent(username)}`).then(r => r.data),
};
