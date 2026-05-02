import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, type TokenResponse } from '../api/auth';
import { apiClient } from '../api/client';

interface UserInfo {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<{ requiresVerification?: boolean; email?: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): Record<string, string> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

function extractUserInfo(token: string): UserInfo | null {
  const payload = parseJwt(token);
  const id =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    payload.sub ??
    '';
  const username =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
    payload.unique_name ??
    '';
  const role =
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
    payload.role ??
    '';

  if (!id) return null;
  return { id, username, role };
}

function saveTokens(tokens: TokenResponse, userId: string) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('userId', userId);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const info = extractUserInfo(token);
      if (info) {
        setUser(info);
      } else {
        clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  // Setup axios interceptor for Authorization header
  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(config => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseInterceptor = apiClient.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const userId = localStorage.getItem('userId');
          const refreshToken = localStorage.getItem('refreshToken');
          if (userId && refreshToken) {
            try {
              const tokens = await authApi.refresh({ userId, refreshToken });
              const info = extractUserInfo(tokens.accessToken);
              if (info) {
                saveTokens(tokens, info.id);
                setUser(info);
                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return apiClient(originalRequest);
              }
            } catch {
              clearTokens();
              setUser(null);
            }
          } else {
            clearTokens();
            setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await authApi.login({ username, password });
    const info = extractUserInfo(tokens.accessToken);
    if (!info) throw new Error('Invalid token received');
    saveTokens(tokens, info.id);
    queryClient.clear();
    setUser(info);
  }, [queryClient]);

  const register = useCallback(async (username: string, password: string, email?: string) => {
    const result = await authApi.register({ username, password, email });
    return result;
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await authApi.verifyEmail({ email, code });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword({ email });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await authApi.resetPassword({ email, code, newPassword });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
