import { useEffect, useState, useMemo, type FC } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, Clock, DollarSign, GraduationCap,
  Building2, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { isApiError, type Doctor, type Hospital } from '@app/shared';
import { apiGetDoctor, apiGetDoctorAvailability, apiGetHospital } from '../../api/search';
import { Button } from '../common/Button';
import type { DoctorAvailabilityItem } from '../../types';

// ── Skeleton ───────────────────────────────────────────────────────────────────
const Skeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

// ── Main page ──────────────────────────────────────────────────────────────────
export const DoctorDetailPage: FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!doctorId) return;
    const run = async () => {
      setLoading(true);
      const docRes = await apiGetDoctor(doctorId);
      if (isApiError(docRes)) { setLoading(false); return; }
      setDoctor(docRes.data);

      // Fetch hospital and 14-day availability in parallel
      const now = new Date();
      const from = now.toISOString().slice(0, 10);
      const to = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);

      const [hospRes, availRes] = await Promise.all([
        apiGetHospital(docRes.data.hospitalId),
        apiGetDoctorAvailability(doctorId, from, to),
      ]);
      if (!isApiError(hospRes)) setHospital(hospRes.data);
      if (!isApiError(availRes)) setAvailability(availRes.data.items);
      setLoading(false);
    };
    void run();
  }, [doctorId]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, DoctorAvailabilityItem[]>();
    for (const slot of availability) {
      const date = new Date(slot.startAt).toISOString().slice(0, 10);
      const list = map.get(date) ?? [];
      list.push(slot);
      map.set(date, list);
    }
    return map;
  }, [availability]);

  const availableDates = useMemo(() => Array.from(slotsByDate.keys()).sort(), [slotsByDate]);
  const slotsForDate = slotsByDate.get(viewDate) ?? [];

  const changeDate = (delta: number) => {
    const d = new Date(viewDate + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta);
    setViewDate(d.toISOString().slice(0, 10));
  };

  const formatDate = (s: string) =>
    new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (!loading && !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Doctor not found</h2>
          <Button onClick={() => navigate('/doctors')}>Browse Doctors</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link to="/doctors" className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-6 transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Doctors
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left: Profile card ── */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="w-full h-48 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : doctor ? (
                <>
                  {doctor.avatarUrl ? (
                    <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-52 object-cover" />
                  ) : (
                    <div className="w-full h-52 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                      <span className="text-7xl font-bold text-teal-300">{doctor.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{doctor.name}</h1>
                    <span className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                      {doctor.specialty}
                    </span>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {doctor.rating && (
                        <div className="bg-yellow-50 rounded-xl p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="font-bold text-gray-900">{doctor.rating}</span>
                          </div>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      )}
                      {doctor.experience && (
                        <div className="bg-teal-50 rounded-xl p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Clock className="h-4 w-4 text-teal-500" />
                            <span className="font-bold text-gray-900">{doctor.experience}</span>
                          </div>
                          <p className="text-xs text-gray-500">Years exp.</p>
                        </div>
                      )}
                      <div className="bg-emerald-50 rounded-xl p-3 text-center col-span-2">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold text-gray-900">${doctor.consultationFee}</span>
                        </div>
                        <p className="text-xs text-gray-500">Consultation fee</p>
                      </div>
                    </div>

                    {/* Hospital */}
                    {hospital && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-xl">
                        <Building2 className="h-4 w-4 text-teal-500 flex-shrink-0" />
                        <span>{hospital.name}</span>
                      </div>
                    )}

                    {/* Education */}
                    {doctor.education && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                        <GraduationCap className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span>{doctor.education}</span>
                      </div>
                    )}

                    <Button onClick={() => navigate(`/booking/${doctor.id}`)} className="w-full" size="lg">
                      Book Appointment
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* ── Right: Bio + Availability ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <p className="text-gray-600 leading-relaxed">{doctor?.bio}</p>
              )}
            </div>

            {/* Availability calendar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Available Slots</h2>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                  </div>
                </div>
              ) : (
                <>
                  {/* Date navigator */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeDate(-1)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Previous day">
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{formatDate(viewDate)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {slotsForDate.length > 0
                          ? `${slotsForDate.length} slot${slotsForDate.length !== 1 ? 's' : ''} available`
                          : 'No slots available'}
                      </p>
                    </div>
                    <button onClick={() => changeDate(1)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Next day">
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Quick-jump to available dates */}
                  {availableDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {availableDates.slice(0, 7).map(date => (
                        <button key={date} onClick={() => setViewDate(date)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            date === viewDate
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                          }`}>
                          {new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Time slots */}
                  {slotsForDate.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slotsForDate.map(slot => (
                        <button key={slot.id}
                          onClick={() => navigate(`/booking/${doctorId}`, { state: { slotStartAt: slot.startAt } })}
                          className="py-2.5 px-3 rounded-xl border-2 border-teal-200 bg-teal-50 text-teal-700 text-sm font-medium hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all">
                          {formatTime(slot.startAt)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No slots on this day.</p>
                      {availableDates.length > 0 && (
                        <p className="text-xs text-teal-600 mt-1">
                          Next available: {new Date(availableDates[0] + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <Button onClick={() => navigate(`/booking/${doctorId}`)} className="w-full" size="lg">
                      Book Appointment
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
