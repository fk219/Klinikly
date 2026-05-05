import type { ApiResponse } from '@app/shared';
import type { User } from '../types';
import { apiClient } from './client';

export const apiRegister = async (params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<ApiResponse<{ accessToken: string; user: User }>> =>
  apiClient.post('/auth/register', params);

export const apiLogin = async (params: {
  email: string;
  password: string;
}): Promise<ApiResponse<{ accessToken: string; user: User }>> => apiClient.post('/auth/login', params);

export const apiLogout = async (): Promise<ApiResponse<{ ok: boolean }>> => apiClient.post('/auth/logout');

