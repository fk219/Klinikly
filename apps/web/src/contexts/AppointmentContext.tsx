import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Appointment, AppointmentContextType, Doctor } from '../types';
import { mockDoctors } from '../data/mockDoctors';

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors] = useState<Doctor[]>(mockDoctors);

  useEffect(() => {
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }
  }, []);

  const saveAppointments = (newAppointments: Appointment[]) => {
    setAppointments(newAppointments);
    localStorage.setItem('appointments', JSON.stringify(newAppointments));
  };

  const bookAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedAppointments = [...appointments, newAppointment];
    saveAppointments(updatedAppointments);
    
    // Update doctor's available slots
    const doctorIndex = doctors.findIndex(d => d.id === appointmentData.doctorId);
    if (doctorIndex !== -1) {
      const slotIndex = doctors[doctorIndex].availableSlots.findIndex(
        slot => slot.date === appointmentData.date && slot.time === appointmentData.time
      );
      if (slotIndex !== -1) {
        doctors[doctorIndex].availableSlots[slotIndex].available = false;
      }
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      const updatedAppointments = appointments.map(apt =>
        apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
      );
      saveAppointments(updatedAppointments);
      
      // Make the slot available again
      const doctorIndex = doctors.findIndex(d => d.id === appointment.doctorId);
      if (doctorIndex !== -1) {
        const slotIndex = doctors[doctorIndex].availableSlots.findIndex(
          slot => slot.date === appointment.date && slot.time === appointment.time
        );
        if (slotIndex !== -1) {
          doctors[doctorIndex].availableSlots[slotIndex].available = true;
        }
      }
    }
  };

  const getAppointmentsByPatient = (patientId: string) => {
    return appointments.filter(apt => apt.patientId === patientId);
  };

  const getAppointmentsByDoctor = (doctorId: string) => {
    return appointments.filter(apt => apt.doctorId === doctorId);
  };

  const getDoctorById = (doctorId: string) => {
    return doctors.find(doctor => doctor.id === doctorId);
  };

  return (
    <AppointmentContext.Provider value={{
      appointments,
      doctors,
      bookAppointment,
      cancelAppointment,
      getAppointmentsByPatient,
      getAppointmentsByDoctor,
      getDoctorById
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
