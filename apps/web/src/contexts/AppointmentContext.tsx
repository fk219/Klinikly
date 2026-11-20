import { useState, useEffect, type ReactNode } from 'react';
import { Appointment, Doctor, Hospital, DoctorAvailabilityItem } from '../types';
import { isApiError } from '@app/shared';
import { apiMyAppointments, apiBookAppointment, apiCancelAppointment } from '../api/appointments';
import { apiGetDoctor, apiGetDoctorAvailability, apiSearchDoctors, apiSearchHospitals } from '../api/search';
import { useAuth } from './authStore';
import { AppointmentContext } from './appointmentStore';

const PAGE_SIZE = 12;

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsMeta, setDoctorsMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const run = async () => {
      const res = await apiSearchHospitals({ page: 1, limit: 50 });
      if (!isApiError(res)) setHospitals(res.data.items);
    };
    void run();
  }, []);

  useEffect(() => {
    if (!userId) { setAppointments([]); return; }
    const run = async () => {
      const res = await apiMyAppointments();
      if (isApiError(res)) return;
      setAppointments(res.data.items);
    };
    void run();
  }, [userId]);

  const refreshDoctors = async (params?: {
    query?: string; specialty?: string; hospitalId?: string; page?: number; limit?: number;
  }) => {
    setDoctorsLoading(true);
    const res = await apiSearchDoctors({ ...params, page: params?.page ?? 1, limit: params?.limit ?? PAGE_SIZE });
    setDoctorsLoading(false);
    if (isApiError(res)) return;
    setDoctors(res.data.items);
    setDoctorsMeta({ page: res.data.page, limit: res.data.limit, total: res.data.total });
  };

  const refreshHospitals = async (params?: { query?: string }) => {
    const res = await apiSearchHospitals({ ...params, page: 1, limit: 50 });
    if (isApiError(res)) return;
    setHospitals(res.data.items);
  };

  const refreshMyAppointments = async () => {
    if (!user) return;
    const res = await apiMyAppointments();
    if (isApiError(res)) return;
    setAppointments(res.data.items);
  };

  const getDoctorById = async (doctorId: string) => {
    const cached = doctors.find((d) => d.id === doctorId);
    if (cached) return cached;
    const res = await apiGetDoctor(doctorId);
    if (isApiError(res)) return null;
    return res.data;
  };

  const getDoctorAvailability = async (doctorId: string, from: string, to: string): Promise<DoctorAvailabilityItem[]> => {
    const res = await apiGetDoctorAvailability(doctorId, from, to);
    if (isApiError(res)) return [];
    return res.data.items;
  };

  const bookAppointment = async (params: { doctorId: string; slotStartAt: string; reason: string }) => {
    const res = await apiBookAppointment(params);
    if (isApiError(res)) return false;
    await refreshMyAppointments();
    return true;
  };

  const cancelAppointment = async (appointmentId: string) => {
    const res = await apiCancelAppointment(appointmentId);
    if (isApiError(res)) return false;
    await refreshMyAppointments();
    return true;
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      doctors,
      doctorsMeta,
      doctorsLoading,
      hospitals,
      refreshDoctors,
      refreshHospitals,
      refreshMyAppointments,
      bookAppointment,
      cancelAppointment,
      getDoctorById,
      getDoctorAvailability
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};
