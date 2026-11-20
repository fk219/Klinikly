import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/authStore';
import { useAppointments } from '../../contexts/appointmentStore';
import { Appointment, Doctor } from '../../types';

const formatDateParts = (value: string) => {
  const date = new Date(value);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
};

const StatusLabel: FC<{ status: Appointment['status'] }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
      status === 'scheduled' ? 'text-pine' : status === 'cancelled' ? 'text-coral' : 'text-muted'
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status === 'scheduled' ? 'bg-pine' : status === 'cancelled' ? 'bg-coral' : 'bg-muted'
      }`}
      aria-hidden="true"
    />
    {status}
  </span>
);

export const DashboardPage: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appointments, getDoctorById, cancelAppointment, refreshMyAppointments } = useAppointments();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [doctorMap, setDoctorMap] = useState<Record<string, Doctor | 'loading' | 'error'>>({});
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    void refreshMyAppointments();
  }, [userId, refreshMyAppointments]);

  useEffect(() => {
    const run = async () => {
      const ids = Array.from(new Set(appointments.map((appointment) => appointment.doctorId)));
      const missing = ids.filter((id) => !doctorMap[id]);
      if (!missing.length) return;

      setDoctorMap((previous) => {
        const next = { ...previous };
        for (const id of missing) next[id] = 'loading';
        return next;
      });

      const pairs = await Promise.all(missing.map(async (id) => [id, await getDoctorById(id)] as const));
      setDoctorMap((previous) => {
        const next = { ...previous };
        for (const [id, doctor] of pairs) next[id] = doctor ?? 'error';
        return next;
      });
    };
    void run();
  }, [appointments, getDoctorById]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = useMemo(() => new Date(), []);

  if (!user) {
    return (
      <div className="container-editorial flex min-h-[60vh] items-center py-20">
        <div>
          <p className="eyebrow">Patient dashboard</p>
          <h1 className="mt-4 max-w-[16ch] font-serif text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.03em] text-ink">
            Your appointments live here.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Sign in to see upcoming visits, past appointments, and cancellation options.
          </p>
          <button type="button" onClick={() => navigate('/auth')} className="btn btn-primary mt-6">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments
    .filter((appointment) => new Date(appointment.slotStartAt) > now && appointment.status === 'scheduled')
    .sort((a, b) => new Date(a.slotStartAt).getTime() - new Date(b.slotStartAt).getTime());

  const pastAppointments = appointments
    .filter(
      (appointment) =>
        new Date(appointment.slotStartAt) <= now ||
        appointment.status === 'completed' ||
        appointment.status === 'cancelled'
    )
    .sort((a, b) => new Date(b.slotStartAt).getTime() - new Date(a.slotStartAt).getTime());

  const visibleAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;
  const uniqueDoctors = new Set(appointments.map((appointment) => appointment.doctorId)).size;

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    const ok = await cancelAppointment(appointmentId);
    setCancellingId(null);
    setPendingCancelId(null);
    if (ok) {
      toast.success('Appointment cancelled. The slot is open again.');
    } else {
      toast.error('Could not cancel this appointment');
    }
  };

  const AppointmentRow: FC<{ appointment: Appointment }> = ({ appointment }) => {
    const doctorEntry = doctorMap[appointment.doctorId];
    const isUpcoming = new Date(appointment.slotStartAt) > now && appointment.status === 'scheduled';
    const date = formatDateParts(appointment.slotStartAt);

    if (doctorEntry === 'loading') {
      return (
        <div className="grid animate-pulse gap-4 border-b border-line py-6 sm:grid-cols-[5rem_1fr_auto] sm:items-center" aria-hidden="true">
          <div className="h-16 w-16 bg-stone" />
          <div className="space-y-2">
            <div className="h-4 w-1/3 bg-stone" />
            <div className="h-3 w-1/2 bg-stone" />
          </div>
          <div className="h-4 w-20 bg-stone" />
        </div>
      );
    }

    if (!doctorEntry || doctorEntry === 'error') {
      return (
        <div className="grid gap-4 border-b border-line py-6 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
          <div className="flex flex-col items-center justify-center border border-line bg-white px-2 py-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{date.weekday}</span>
            <span className="font-serif text-2xl leading-none text-ink">{date.day}</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{date.month}</span>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm text-ink">
              <AlertCircle className="h-4 w-4 text-coral" aria-hidden="true" />
              Doctor details unavailable
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              {date.full} · {date.time}
            </p>
          </div>
          <StatusLabel status={appointment.status} />
        </div>
      );
    }

    const doctor = doctorEntry;

    return (
      <div className="grid gap-4 border-b border-line py-6 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
        <div className="flex w-16 flex-col items-center justify-center border border-line bg-white px-2 py-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{date.weekday}</span>
          <span className="font-serif text-2xl leading-none text-ink">{date.day}</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">{date.month}</span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => navigate(`/doctors/${doctor.id}`)}
              className="font-serif text-2xl leading-tight text-ink transition-colors hover:text-pine"
            >
              {doctor.name}
            </button>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-coral">{doctor.specialty}</span>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            {date.time} · {date.full}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            <span className="text-ink">Reason:</span> {appointment.reason}
          </p>

          {pendingCancelId === appointment.id && (
            <div className="mt-3 border border-coral/30 bg-[#F7ECE6] p-3">
              <p className="text-sm text-ink">Cancel this appointment and release the slot?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCancelAppointment(appointment.id)}
                  disabled={cancellingId === appointment.id}
                  className="inline-flex min-h-9 items-center bg-coral px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-ink disabled:opacity-50"
                >
                  {cancellingId === appointment.id ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingCancelId(null)}
                  className="inline-flex min-h-9 items-center border border-line bg-white px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <StatusLabel status={appointment.status} />
          {isUpcoming && pendingCancelId !== appointment.id && (
            <button
              type="button"
              onClick={() => setPendingCancelId(appointment.id)}
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-coral"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-canvas">
      <section className="container-editorial pb-16 pt-12 lg:pb-24 lg:pt-16">
        <div className="flex flex-col justify-between gap-8 border-b border-line pb-9 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Patient dashboard</p>
            <h1 className="mt-4 max-w-[16ch] font-serif text-[clamp(3rem,5.5vw,5.2rem)] leading-[0.9] tracking-[-0.04em] text-ink">
              Visits, <span className="italic text-coral">accounted for.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
              Signed in as {user.name}. Cancel a visit and the time returns to the hospital schedule.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/doctors')} className="btn btn-primary">
            Book a doctor
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <dl className="grid border-b border-line sm:grid-cols-3">
          {[
            { label: 'Upcoming', value: upcomingAppointments.length },
            { label: 'Total booked', value: appointments.length },
            { label: 'Specialists seen', value: uniqueDoctors },
          ].map((stat) => (
            <div key={stat.label} className="border-b border-line py-6 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 sm:first:pl-0">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{stat.label}</dt>
              <dd className="mt-2 font-serif text-4xl tabular-nums text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <aside className="lg:col-span-3">
            <div className="border border-line bg-white">
              <div className="flex items-center gap-3 border-b border-line p-5">
                <span className="flex h-12 w-12 items-center justify-center bg-ink font-serif text-xl text-canvas">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-serif text-xl text-ink">{user.name}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <dl className="space-y-3 p-5 text-sm">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Email</dt>
                  <dd className="mt-1 break-all text-ink">{user.email}</dd>
                </div>
                {user.phone ? (
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Phone</dt>
                    <dd className="mt-1 text-ink">{user.phone}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="border-t border-line p-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-muted">
                Demo account · Seeded hospitals
              </p>
            </div>
          </aside>

          <div className="lg:col-span-8 lg:col-start-5">
            <div className="flex items-end justify-between gap-4 border-b border-line">
              <div className="flex gap-6">
                {(['upcoming', 'past'] as const).map((tab) => {
                  const count = tab === 'upcoming' ? upcomingAppointments.length : pastAppointments.length;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      aria-pressed={activeTab === tab}
                      className={`-mb-px border-b-2 pb-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                        activeTab === tab
                          ? 'border-pine text-pine'
                          : 'border-transparent text-muted hover:text-ink'
                      }`}
                    >
                      {tab === 'upcoming' ? 'Upcoming' : 'Past'} <span className="tabular-nums">({count})</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => navigate('/doctors')} className="hidden pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink sm:block">
                New booking
              </button>
            </div>

            {visibleAppointments.length > 0 ? (
              <div className="mt-2">
                {visibleAppointments.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <div className="border-b border-line py-16 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">
                  {activeTab === 'upcoming' ? 'Nothing booked' : 'No history yet'}
                </p>
                <h2 className="mt-4 font-serif text-3xl text-ink">
                  {activeTab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments.'}
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  {activeTab === 'upcoming'
                    ? 'Pick a specialist and claim a slot from the live schedule.'
                    : 'Completed and cancelled visits will appear here.'}
                </p>
                {activeTab === 'upcoming' && (
                  <button type="button" onClick={() => navigate('/doctors')} className="btn btn-primary mt-6">
                    Find a doctor
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
