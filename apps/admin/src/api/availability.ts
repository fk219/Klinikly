import { apiClient } from './client';

export type WeeklyWindow = { start: string; end: string };
export type WeeklyTemplate = {
  mon?: WeeklyWindow[];
  tue?: WeeklyWindow[];
  wed?: WeeklyWindow[];
  thu?: WeeklyWindow[];
  fri?: WeeklyWindow[];
  sat?: WeeklyWindow[];
  sun?: WeeklyWindow[];
};

export type AvailabilityRule = {
  id: string;
  doctorId: string;
  timezone: string;
  slotDurationMinutes: number;
  weeklyTemplate: WeeklyTemplate;
};

export type SlotItem = {
  id: string;
  doctorId: string;
  startAt: string;
  status: 'available' | 'booked' | 'blocked';
  source: string;
};

export const apiUpsertRule = (doctorId: string, data: Omit<AvailabilityRule, 'id' | 'doctorId'>) =>
  apiClient.put<AvailabilityRule>(`/admin/doctors/${doctorId}/availability-rules`, data);

export const apiGenerateSlots = (doctorId: string, from: string, to: string) =>
  apiClient.post<{ createdOrKept: number }>(`/admin/doctors/${doctorId}/slots/generate`, { from, to });

export const apiListSlots = (doctorId: string, from?: string, to?: string) => {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return apiClient.get<{ items: SlotItem[] }>(`/admin/doctors/${doctorId}/slots${suffix}`);
};

export const apiAddSlot = (doctorId: string, startAt: string) =>
  apiClient.post<{ ok: boolean }>(`/admin/doctors/${doctorId}/slots`, { startAt });

export const apiBlockSlot = (doctorId: string, startAt: string) =>
  apiClient.post<{ ok: boolean }>(`/admin/doctors/${doctorId}/slots/block`, { startAt });

export const apiDeleteSlot = (slotId: string) =>
  apiClient.delete<{ ok: boolean }>(`/admin/slots/${slotId}`);
