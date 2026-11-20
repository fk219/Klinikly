import { apiClient } from './client';

export type AdminAppointment = {
  id: string;
  hospitalId: string;
  doctorId: string;
  patientUserId: string;
  slotStartAt: string;
  reason: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: string;
};

export const apiListAppointments = (params?: { doctorId?: string; from?: string; to?: string }) => {
  const q = new URLSearchParams();
  if (params?.doctorId) q.set('doctorId', params.doctorId);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return apiClient.get<{ items: AdminAppointment[] }>(`/admin/appointments${suffix}`);
};

export const apiCancelAppointment = (id: string) =>
  apiClient.post<{ ok: boolean }>(`/admin/appointments/${id}/cancel`);

export const apiCompleteAppointment = (id: string) =>
  apiClient.post<{ ok: boolean }>(`/admin/appointments/${id}/complete`);
