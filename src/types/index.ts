export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'patient' | 'doctor';
  avatar?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  experience: number;
  rating: number;
  bio: string;
  education: string;
  availableSlots: TimeSlot[];
  consultationFee: number;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface AppointmentContextType {
  appointments: Appointment[];
  doctors: Doctor[];
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  cancelAppointment: (appointmentId: string) => void;
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getDoctorById: (doctorId: string) => Doctor | undefined;
}