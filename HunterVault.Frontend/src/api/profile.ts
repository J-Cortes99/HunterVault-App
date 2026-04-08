import { apiClient } from './client';
import type { UserProfile, UpdateProfilePayload, UserSearchResult, ActivityFeedItem } from '../types';

export const profileApi = {
  getByUsername: (username: string) =>
    apiClient.get<UserProfile>(`/profile/${username}`).then(r => r.data),
    
  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient.put<{ message: string }>('/profile', payload).then(r => r.data),

  searchUsers: (query: string) =>
    apiClient.get<UserSearchResult[]>(`/profile/search?query=${query}`).then(r => r.data),

  followUser: (targetUserId: string) =>
    apiClient.post<{ message: string }>(`/profile/follow/${targetUserId}`).then(r => r.data),

  unfollowUser: (targetUserId: string) =>
    apiClient.delete<{ message: string }>(`/profile/follow/${targetUserId}`).then(r => r.data),

  getFeed: (page = 1, pageSize = 10) =>
    apiClient.get<ActivityFeedItem[]>(`/profile/feed?page=${page}&pageSize=${pageSize}`).then(r => r.data),

  getRecommended: () =>
    apiClient.get<UserSearchResult[]>('/profile/recommended').then(r => r.data),
};
