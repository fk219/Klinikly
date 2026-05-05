import type { Appointment, Doctor, Hospital, UserRole } from '@app/shared';

export type { Appointment, Doctor, Hospital, UserRole } from '@app/shared';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
};

export type DoctorAvailabilityItem = {
  id: string;
  startAt: string;
};

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; email: string; phone?: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface AppointmentContextType {
  appointments: Appointment[];
  doctors: Doctor[];
  hospitals: Hospital[];
  refreshDoctors: (params?: { query?: string; specialty?: string; hospitalId?: string }) => Promise<void>;
  refreshHospitals: (params?: { query?: string }) => Promise<void>;
  refreshMyAppointments: () => Promise<void>;
  bookAppointment: (params: { doctorId: string; slotStartAt: string; reason: string }) => Promise<boolean>;
  cancelAppointment: (appointmentId: string) => Promise<boolean>;
  getDoctorById: (doctorId: string) => Promise<Doctor | null>;
  getDoctorAvailability: (doctorId: string, from: string, to: string) => Promise<DoctorAvailabilityItem[]>;
}
