import { useState, useEffect, type ReactNode } from 'react';
import { Appointment, Doctor, Hospital, DoctorAvailabilityItem } from '../types';
import { isApiError } from '@app/shared';
import { apiMyAppointments, apiBookAppointment, apiCancelAppointment } from '../api/appointments';
import { apiGetDoctor, apiGetDoctorAvailability, apiSearchDoctors, apiSearchHospitals } from '../api/search';
import { useAuth } from './authStore';
import { AppointmentContext } from './appointmentStore';

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const run = async () => {
      const [h, d] = await Promise.all([
        apiSearchHospitals({ page: 1, limit: 200 }),
        apiSearchDoctors({ page: 1, limit: 200 })
      ]);
      if (!isApiError(h)) setHospitals(h.data.items);
      if (!isApiError(d)) setDoctors(d.data.items);
    };
    void run();
  }, []);

  useEffect(() => {
    if (!userId) {
      setAppointments([]);
      return;
    }
    const run = async () => {
      const res = await apiMyAppointments();
      if (isApiError(res)) return;
      setAppointments(res.data.items);
    };
    void run();
  }, [userId]);

  const refreshDoctors = async (params?: { query?: string; specialty?: string; hospitalId?: string }) => {
    const res = await apiSearchDoctors({ ...params, page: 1, limit: 200 });
    if (isApiError(res)) return;
    setDoctors(res.data.items);
  };

  const refreshHospitals = async (params?: { query?: string }) => {
    const res = await apiSearchHospitals({ ...params, page: 1, limit: 200 });
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
