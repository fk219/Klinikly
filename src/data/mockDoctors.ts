import { Doctor, TimeSlot } from '../types';

const generateTimeSlots = (doctorId: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    times.forEach((time, index) => {
      slots.push({
        id: `${doctorId}-${dateStr}-${time}`,
        date: dateStr,
        time,
        available: Math.random() > 0.3 // 70% chance of being available
      });
    });
  }
  
  return slots;
};

export const mockDoctors: Doctor[] = [
  {
    id: 'dr-1',
    email: 'sarah.johnson@hospital.com',
    name: 'Dr. Sarah Johnson',
    phone: '+1 (555) 123-4567',
    role: 'doctor',
    specialty: 'Cardiology',
    experience: 15,
    rating: 4.9,
    bio: 'Dr. Sarah Johnson is a board-certified cardiologist with over 15 years of experience treating heart conditions. She specializes in preventive cardiology and cardiac imaging.',
    education: 'MD from Harvard Medical School, Residency at Johns Hopkins',
    consultationFee: 200,
    availableSlots: [],
    avatar: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
  },
  {
    id: 'dr-2',
    email: 'michael.chen@hospital.com',
    name: 'Dr. Michael Chen',
    phone: '+1 (555) 234-5678',
    role: 'doctor',
    specialty: 'Neurology',
    experience: 12,
    rating: 4.8,
    bio: 'Neurologist specializing in movement disorders and epilepsy treatment. Dr. Chen has published numerous research papers in leading medical journals.',
    education: 'MD from Stanford University, Fellowship at Mayo Clinic',
    consultationFee: 250,
    availableSlots: [],
    avatar: 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
  },
  {
    id: 'dr-3',
    email: 'emily.rodriguez@hospital.com',
    name: 'Dr. Emily Rodriguez',
    phone: '+1 (555) 345-6789',
    role: 'doctor',
    specialty: 'Pediatrics',
    experience: 8,
    rating: 4.9,
    bio: 'Pediatrician with expertise in child development and adolescent medicine. Known for her compassionate approach with young patients.',
    education: 'MD from UCLA, Pediatric Residency at Children\'s Hospital LA',
    consultationFee: 150,
    availableSlots: [],
    avatar: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
  },
  {
    id: 'dr-4',
    email: 'david.kim@hospital.com',
    name: 'Dr. David Kim',
    phone: '+1 (555) 456-7890',
    role: 'doctor',
    specialty: 'Orthopedics',
    experience: 20,
    rating: 4.7,
    bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement. Has performed over 5,000 successful surgeries.',
    education: 'MD from Johns Hopkins, Orthopedic Surgery Residency at Hospital for Special Surgery',
    consultationFee: 300,
    availableSlots: [],
    avatar: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
  },
  {
    id: 'dr-5',
    email: 'lisa.thompson@hospital.com',
    name: 'Dr. Lisa Thompson',
    phone: '+1 (555) 567-8901',
    role: 'doctor',
    specialty: 'Dermatology',
    experience: 10,
    rating: 4.8,
    bio: 'Dermatologist with expertise in cosmetic and medical dermatology. Specializes in skin cancer detection and treatment.',
    education: 'MD from Northwestern University, Dermatology Residency at University of Chicago',
    consultationFee: 180,
    availableSlots: [],
    avatar: 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
  },
  {
    id: 'dr-6',
    email: 'james.wilson@hospital.com',
    name: 'Dr. James Wilson',
    phone: '+1 (555) 678-9012',
    role: 'doctor',
    specialty: 'Psychiatry',
    experience: 18,
    rating: 4.9,
    bio: 'Psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy. Takes a holistic approach to mental health.',
    education: 'MD from Yale University, Psychiatry Residency at Massachusetts General Hospital',
    consultationFee: 220,
    availableSlots: [],
    avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
  }
];

// Generate time slots for each doctor
mockDoctors.forEach(doctor => {
  doctor.availableSlots = generateTimeSlots(doctor.id);
});