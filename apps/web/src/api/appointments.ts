import type { ApiResponse, Appointment } from '@app/shared';
import { apiClient } from './client';

export const apiBookAppointment = async (params: {
  doctorId: string;
  slotStartAt: string;
  reason: string;
}): Promise<ApiResponse<Appointment>> => apiClient.post('/appointments', params);

export const apiCancelAppointment = async (appointmentId: string): Promise<ApiResponse<{ ok: boolean }>> =>
  apiClient.post(`/appointments/${appointmentId}/cancel`);

export const apiMyAppointments = async (): Promise<ApiResponse<{ items: Appointment[] }>> =>
  apiClient.get('/me/appointments');

