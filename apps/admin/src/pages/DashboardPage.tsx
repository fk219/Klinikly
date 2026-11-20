import { useEffect, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarPlus, Clock3, Users } from 'lucide-react';
import { isApiError } from '@app/shared';
import { useAuth } from '../contexts/useAuth';
import { apiListDoctors, apiGetHospital, type AdminDoctor } from '../api/doctors';
import { apiListAppointments, type AdminAppointment } from '../api/appointments';

const statusTone = (status: string) =>
  status === 'scheduled' ? 'text-pine' : status === 'cancelled' ? 'text-coral' : 'text-muted';

export const DashboardPage: FC = () => {
  const { user } = useAuth();
  const [hospitalName, setHospitalName] = useState('');
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const [hospitalRes, doctorsRes, appointmentsRes] = await Promise.all([
        apiGetHospital(),
        apiListDoctors(),
        apiListAppointments(),
      ]);
      if (!isApiError(hospitalRes)) setHospitalName(hospitalRes.data.name);
      if (!isApiError(doctorsRes)) setDoctors(doctorsRes.data.items);
      if (!isApiError(appointmentsRes)) setAppointments(appointmentsRes.data.items);
      setLoading(false);
    };
    void run();
  }, []);

  const now = new Date();
  const upcoming = appointments
    .filter(
      (appointment) => new Date(appointment.slotStartAt) > now && appointment.status === 'scheduled'
    )
    .sort((a, b) => new Date(a.slotStartAt).getTime() - new Date(b.slotStartAt).getTime());
  const completed = appointments.filter((appointment) => appointment.status === 'completed');
  const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled');

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const doctorName = (id: string) => doctors.find((doctor) => doctor.id === id)?.name ?? 'Doctor unavailable';
  const doctorSpecialty = (id: string) => doctors.find((doctor) => doctor.id === id)?.specialty ?? '';

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="admin-page">
        <div className="h-4 w-36 animate-pulse bg-stone" />
        <div className="mt-6 h-14 w-3/5 animate-pulse bg-stone" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse border border-line bg-white" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Doctors', value: doctors.length, href: '/doctors', note: 'in this hospital' },
    { label: 'Upcoming', value: upcoming.length, href: '/appointments', note: 'scheduled ahead' },
    { label: 'Completed', value: completed.length, href: '/appointments', note: 'all time' },
    { label: 'Cancelled', value: cancelled.length, href: '/appointments', note: 'slots released' },
  ];

  return (
    <div className="admin-page">
      <header className="border-b border-line pb-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Hospital overview / {hospitalName || 'Loading hospital'}</p>
            <h1 className="admin-title mt-4 max-w-[15ch]">
              The week, <span className="italic text-coral">in order.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Signed in as {user?.name}. {todayLabel}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/availability"
              className="inline-flex min-h-11 items-center gap-2 border border-line bg-white px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Manage availability
            </Link>
            <Link
              to="/doctors"
              className="inline-flex min-h-11 items-center gap-2 bg-pine px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-ink"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Doctors
            </Link>
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-2 border-b border-line xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group border-b border-line py-5 pr-4 transition-colors even:border-l even:pl-4 hover:bg-white sm:py-6 xl:border-b-0 xl:border-r xl:px-6 xl:first:pl-0 xl:last:border-r-0 xl:even:border-l-0"
          >
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{stat.label}</dt>
            <dd className="mt-2 font-serif text-4xl leading-none tabular-nums text-ink transition-colors group-hover:text-pine sm:text-5xl">
              {stat.value}
            </dd>
            <dd className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{stat.note}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-10 grid gap-8 xl:grid-cols-12 xl:gap-10">
        <section className="xl:col-span-8" aria-labelledby="recent-title">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
            <h2 id="recent-title" className="font-serif text-2xl text-ink">
              Recent appointments
            </h2>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="border-b border-line py-12">
              <p className="font-serif text-2xl text-ink">No appointments booked yet.</p>
              <p className="mt-2 text-sm text-muted">
                Once a patient books a generated slot, it appears here.
              </p>
            </div>
          ) : (
            <div>
              {recentAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="grid gap-3 border-b border-line py-5 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    <p className="text-ink">{formatDate(appointment.slotStartAt)}</p>
                    <p className="mt-1 tabular-nums">{formatTime(appointment.slotStartAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">
                      {doctorName(appointment.doctorId)}
                      {doctorSpecialty(appointment.doctorId) ? (
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-coral">
                          {doctorSpecialty(appointment.doctorId)}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted">{appointment.reason}</p>
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${statusTone(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="xl:col-span-3 xl:col-start-10">
          <div className="border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-xl text-ink">
                <Clock3 className="h-4 w-4 text-pine" aria-hidden="true" />
                Next up
              </h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-5 py-6 text-sm leading-relaxed text-muted">
                No upcoming appointments in the schedule.
              </p>
            ) : (
              <ol className="divide-y divide-line">
                {upcoming.slice(0, 3).map((appointment) => (
                  <li key={appointment.id} className="px-5 py-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-coral">
                      {formatDate(appointment.slotStartAt)} · {formatTime(appointment.slotStartAt)}
                    </p>
                    <p className="mt-1.5 text-sm text-ink">{doctorName(appointment.doctorId)}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{appointment.reason}</p>
                  </li>
                ))}
              </ol>
            )}
            <Link
              to="/appointments"
              className="flex min-h-11 items-center justify-center border-t border-line font-mono text-[10px] uppercase tracking-[0.14em] text-pine transition-colors hover:bg-sage/50"
            >
              Open appointment desk
            </Link>
          </div>

          <div className="mt-5 border border-line p-5">
            <p className="eyebrow">Hospital scope</p>
            <p className="mt-3 font-serif text-xl leading-snug text-ink">{hospitalName || 'This hospital'}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Doctors, schedules, and appointments are isolated to your hospital account.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
