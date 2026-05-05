import { useEffect, useMemo, useState, type FC } from 'react';
import { Calendar, Clock, User, Phone, Mail, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/authStore';
import { useAppointments } from '../../contexts/appointmentStore';
import { Button } from '../common/Button';
import { Appointment, Doctor } from '../../types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { appointments, getDoctorById, cancelAppointment, refreshMyAppointments } = useAppointments();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [doctorMap, setDoctorMap] = useState<Record<string, Doctor>>({});
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    void refreshMyAppointments();
  }, [userId, refreshMyAppointments]);

  useEffect(() => {
    const run = async () => {
      const ids = Array.from(new Set(appointments.map((a) => a.doctorId)));
      const missing = ids.filter((id) => !doctorMap[id]);
      if (!missing.length) return;

      const pairs = await Promise.all(missing.map(async (id) => [id, await getDoctorById(id)] as const));
      setDoctorMap((prev) => {
        const next: Record<string, Doctor> = { ...prev };
        for (const [id, doc] of pairs) {
          if (doc) next[id] = doc;
        }
        return next;
      });
    };
    void run();
  }, [appointments, doctorMap, getDoctorById]);

  const now = useMemo(() => new Date(), []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to view your dashboard
          </h2>
          <Button onClick={() => onNavigate('auth')}>Sign In</Button>
        </div>
      </div>
    );
  }
  
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.slotStartAt) > now && apt.status === 'scheduled')
    .sort((a, b) => new Date(a.slotStartAt).getTime() - new Date(b.slotStartAt).getTime());

  const pastAppointments = appointments
    .filter((apt) => new Date(apt.slotStartAt) <= now || apt.status === 'completed' || apt.status === 'cancelled')
    .sort((a, b) => new Date(b.slotStartAt).getTime() - new Date(a.slotStartAt).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateTimeString: string) =>
    new Date(dateTimeString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    await cancelAppointment(appointmentId);
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const doctor = doctorMap[appointment.doctorId];
    if (!doctor) return null;

    const isUpcoming = new Date(appointment.slotStartAt) > now && appointment.status === 'scheduled';

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <img
              src={doctor.avatarUrl ?? ''}
              alt={doctor.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-teal-600 font-medium mb-2">{doctor.specialty}</p>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(appointment.slotStartAt)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{formatTime(appointment.slotStartAt)}</span>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span> {appointment.reason}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              appointment.status === 'scheduled' 
                ? 'bg-green-100 text-green-800'
                : appointment.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>

            {isUpcoming && (
              <button
                onClick={() => handleCancelAppointment(appointment.id)}
                className="text-red-600 hover:text-red-700 transition-colors"
                title="Cancel appointment"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your appointments and health records</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                <p className="text-gray-600 capitalize">{user.role}</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">{user.phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => onNavigate('doctors')}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Appointment
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <User className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Doctors Visited</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(appointments.map(apt => apt.doctorId)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'upcoming'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Upcoming Appointments ({upcomingAppointments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'past'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Past Appointments ({pastAppointments.length})
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'upcoming' ? (
                  <div className="space-y-4">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No upcoming appointments
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Book an appointment with one of our qualified doctors.
                        </p>
                        <Button onClick={() => onNavigate('doctors')}>
                          Book Appointment
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastAppointments.length > 0 ? (
                      pastAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No past appointments
                        </h3>
                        <p className="text-gray-600">
                          Your appointment history will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
