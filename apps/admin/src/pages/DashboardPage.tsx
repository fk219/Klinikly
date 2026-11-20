import { useEffect, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle, XCircle, ArrowRight, Building2 } from 'lucide-react';
import { isApiError } from '@app/shared';
import { useAuth } from '../contexts/useAuth';
import { apiListDoctors, apiGetHospital } from '../api/doctors';
import { apiListAppointments, type AdminAppointment } from '../api/appointments';

export const DashboardPage: FC = () => {
  const { user } = useAuth();
  const [hospitalName, setHospitalName] = useState('');
  const [doctorCount, setDoctorCount] = useState(0);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const [hospRes, docRes, apptRes] = await Promise.all([
        apiGetHospital(),
        apiListDoctors(),
        apiListAppointments(),
      ]);
      if (!isApiError(hospRes)) setHospitalName(hospRes.data.name);
      if (!isApiError(docRes)) setDoctorCount(docRes.data.total);
      if (!isApiError(apptRes)) setAppointments(apptRes.data.items);
      setLoading(false);
    };
    void run();
  }, []);

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.slotStartAt) > now && a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (s: string) => new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const statusColor = (s: string) =>
    s === 'scheduled' ? 'bg-green-100 text-green-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2 mt-1">
          <Building2 className="h-4 w-4 text-teal-600" />
          <p className="text-sm text-gray-500">{hospitalName || 'Loading...'}</p>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Doctors', value: doctorCount, icon: Users, color: 'bg-blue-50 text-blue-600', link: '/doctors' },
          { label: 'Upcoming', value: upcoming.length, icon: Calendar, color: 'bg-teal-50 text-teal-600', link: '/appointments' },
          { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'bg-green-50 text-green-600', link: '/appointments' },
          { label: 'Cancelled', value: cancelled.length, icon: XCircle, color: 'bg-red-50 text-red-600', link: '/appointments' },
        ].map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Appointments</h2>
          <Link to="/appointments" className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentAppointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">No appointments yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAppointments.map(appt => (
              <div key={appt.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(appt.slotStartAt)} at {formatTime(appt.slotStartAt)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{appt.reason}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(appt.status)}`}>
                  {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
