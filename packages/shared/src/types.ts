export type UserRole = 'patient' | 'hospital_admin' | 'platform_admin';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = { data: T } | { error: ApiError };

export type Hospital = {
  id: string;
  name: string;
  slug: string;
};

export type Doctor = {
  id: string;
  hospitalId: string;
  name: string;
  specialty: string;
  bio: string;
  education?: string;
  experience?: number;
  consultationFee: number;
  rating?: number;
  avatarUrl?: string;
};

export type AvailabilitySlotStatus = 'available' | 'booked' | 'blocked';

export type AvailabilitySlot = {
  id: string;
  doctorId: string;
  hospitalId: string;
  startAt: string;
  status: AvailabilitySlotStatus;
};

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed';

export type Appointment = {
  id: string;
  hospitalId: string;
  doctorId: string;
  patientUserId: string;
  slotStartAt: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
};
