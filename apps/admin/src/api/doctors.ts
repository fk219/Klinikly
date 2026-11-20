import type { Doctor } from '@app/shared';

// Extended Doctor type with admin-only fields
export type AdminDoctor = Doctor & { active: boolean };
import { apiClient } from './client';

export type DoctorInput = {
  name: string;
  specialty: string;
  bio: string;
  education?: string;
  experience?: number;
  consultationFee: number;
  avatarUrl?: string;
};

export const apiListDoctors = () =>
  apiClient.get<{ items: AdminDoctor[]; total: number }>('/admin/doctors');

export const apiCreateDoctor = (data: DoctorInput) =>
  apiClient.post<AdminDoctor>('/admin/doctors', data);

export const apiUpdateDoctor = (id: string, data: Partial<DoctorInput> & { active?: boolean }) =>
  apiClient.patch<AdminDoctor>(`/admin/doctors/${id}`, data);

export const apiGetHospital = () =>
  apiClient.get<{ id: string; name: string; slug: string }>('/admin/hospital');
