import { apiClient } from './client';
import type { UserProfile, UpdateProfilePayload } from '../types';

export const profileApi = {
  getByUsername: (username: string) =>
    apiClient.get<UserProfile>(`/profile/${username}`).then(r => r.data),
    
  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient.put<{ message: string }>('/profile', payload).then(r => r.data),
};
