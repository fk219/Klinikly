import { useEffect, useState, type FC } from 'react';
import { isApiError } from '@app/shared';
import { Search, CheckCircle, XCircle, Filter } from 'lucide-react';
import { apiListAppointments, apiCancelAppointment, apiCompleteAppointment, type AdminAppointment } from '../api/appointments';
import { apiListDoctors } from '../api/doctors';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

type AppointmentFilters = {
  doctorId?: string;
  from?: string;
  to?: string;
};

const loadAppointmentData = async (filters: AppointmentFilters) => {
  const [apptRes, docRes] = await Promise.all([
    apiListAppointments(filters),
    apiListDoctors(),
  ]);

  return {
    appointments: isApiError(apptRes) ? null : apptRes.data.items,
    doctors: isApiError(docRes) ? null : docRes.data.items,
  };
};

export const AppointmentsPage: FC = () => {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ action: 'cancel' | 'complete'; id: string } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let active = true;

    void loadAppointmentData({}).then((data) => {
      if (!active) return;
      if (data.appointments) setAppointments(data.appointments);
      if (data.doctors) setDoctors(data.doctors);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await loadAppointmentData({
      doctorId: filterDoctor || undefined,
      from: filterFrom ? `${filterFrom}T00:00:00.000Z` : undefined,
      to: filterTo ? `${filterTo}T23:59:59.999Z` : undefined,
    });
    if (data.appointments) setAppointments(data.appointments);
    if (data.doctors) setDoctors(data.doctors);
    setLoading(false);
  };

  const handleFilter = (e: React.FormEvent) => { e.preventDefault(); void load(); };

  const handleAction = async () => {
    if (!confirmModal) return;
    setActing(true);
    if (confirmModal.action === 'cancel') await apiCancelAppointment(confirmModal.id);
    else await apiCompleteAppointment(confirmModal.id);
    setActing(false);
    setConfirmModal(null);
    void load();
  };

  const doctorName = (id: string) => doctors.find(d => d.id === id)?.name ?? id.slice(-6);

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (s: string) => new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const statusBadge = (s: string): 'green' | 'red' | 'gray' =>
    s === 'scheduled' ? 'green' : s === 'cancelled' ? 'red' : 'gray';

  return (
    <div className="admin-page">
      <div className="mb-6">
        <h1 className="admin-title">Appointments</h1>
        <p className="text-sm text-muted mt-0.5">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white border border-line p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-muted mb-1">Doctor</label>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-line text-sm focus:outline-none focus:border-pine focus:outline-none appearance-none bg-white">
                <option value="">All Doctors</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="px-3 py-2 border border-line text-sm focus:outline-none focus:border-pine focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">To</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="px-3 py-2 border border-line text-sm focus:outline-none focus:border-pine focus:outline-none" />
          </div>
          <Button type="submit" size="sm">
            <Search className="h-4 w-4 mr-1.5" /> Search
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setFilterDoctor(''); setFilterFrom(''); setFilterTo(''); }}>
            Clear
          </Button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-line overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pine border-t-transparent rounded-full animate-spin" /></div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">No appointments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone/40 border-b border-line">
                <tr>
                  {['Doctor', 'Date & Time', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-stone/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-ink">{doctorName(appt.doctorId)}</td>
                    <td className="px-5 py-4 text-muted whitespace-nowrap">
                      {formatDate(appt.slotStartAt)}<br />
                      <span className="text-xs text-muted">{formatTime(appt.slotStartAt)}</span>
                    </td>
                    <td className="px-5 py-4 text-muted max-w-xs">
                      <p className="truncate">{appt.reason}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusBadge(appt.status)}>
                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {appt.status === 'scheduled' && (
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmModal({ action: 'complete', id: appt.id })}
                            title="Mark complete" className="p-1.5 text-pine hover:bg-green-50 transition-colors">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmModal({ action: 'cancel', id: appt.id })}
                            title="Cancel" className="p-1.5 text-coral hover:bg-[#F7ECE6] transition-colors">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === 'cancel' ? 'Cancel Appointment' : 'Complete Appointment'}>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {confirmModal?.action === 'cancel'
              ? 'Are you sure you want to cancel this appointment? The slot will be freed.'
              : 'Mark this appointment as completed?'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant={confirmModal?.action === 'cancel' ? 'danger' : 'primary'} loading={acting} onClick={() => void handleAction()}>
              {confirmModal?.action === 'cancel' ? 'Cancel Appointment' : 'Mark Complete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
