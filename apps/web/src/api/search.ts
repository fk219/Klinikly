import type { ApiResponse, Doctor, Hospital } from '@app/shared';
import { apiClient } from './client';
import type { DoctorAvailabilityItem } from '../types';

export const apiSearchHospitals = async (params?: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ items: Hospital[]; page: number; limit: number; total: number }>> => {
  const q = new URLSearchParams();
  if (params?.query) q.set('query', params.query);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return apiClient.get(`/hospitals${suffix}`);
};

export const apiSearchDoctors = async (params?: {
  query?: string;
  specialty?: string;
  hospitalId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ items: Doctor[]; page: number; limit: number; total: number }>> => {
  const q = new URLSearchParams();
  if (params?.query) q.set('query', params.query);
  if (params?.specialty) q.set('specialty', params.specialty);
  if (params?.hospitalId) q.set('hospitalId', params.hospitalId);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return apiClient.get(`/doctors${suffix}`);
};

export const apiGetDoctor = async (doctorId: string): Promise<ApiResponse<Doctor>> =>
  apiClient.get(`/doctors/${doctorId}`);

export const apiGetDoctorAvailability = async (
  doctorId: string,
  from: string,
  to: string
): Promise<ApiResponse<{ items: DoctorAvailabilityItem[] }>> => {
  const q = new URLSearchParams({ from, to });
  return apiClient.get(`/doctors/${doctorId}/availability?${q.toString()}`);
};

