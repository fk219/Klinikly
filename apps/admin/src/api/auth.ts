import type { ApiResponse } from '@app/shared';
import { apiClient } from './client';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export const apiLogin = (params: { email: string; password: string }) =>
  apiClient.post<{ accessToken: string; user: AdminUser }>('/auth/login', params);

export const apiLogout = () => apiClient.post<{ ok: boolean }>('/auth/logout');

export const apiGetMe = (): Promise<ApiResponse<{ user: AdminUser }>> =>
  apiClient.get('/me');
