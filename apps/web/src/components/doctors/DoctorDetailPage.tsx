import { useEffect, useMemo, useState, type FC } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { isApiError, type Doctor, type Hospital } from '@app/shared';
import { apiGetDoctor, apiGetDoctorAvailability, apiGetHospital } from '../../api/search';
import type { DoctorAvailabilityItem } from '../../types';
import { doctorInitial } from '../../utils/doctorInitial';

const Skeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-stone ${className}`} aria-hidden="true" />
);

const formatDate = (dateKey: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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
      if (isApiError(docRes)) {
        setLoading(false);
        return;
      }
      setDoctor(docRes.data);

      const now = new Date();
      const from = now.toISOString().slice(0, 10);
      const to = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);

      const [hospitalRes, availabilityRes] = await Promise.all([
        apiGetHospital(docRes.data.hospitalId),
        apiGetDoctorAvailability(doctorId, from, to),
      ]);
      if (!isApiError(hospitalRes)) setHospital(hospitalRes.data);
      if (!isApiError(availabilityRes)) {
        const items = availabilityRes.data.items;
        setAvailability(items);
        if (items.length > 0) {
          const firstAvailableDate = new Date(items[0].startAt).toISOString().slice(0, 10);
          setViewDate((current) =>
            items.some((slot) => new Date(slot.startAt).toISOString().slice(0, 10) === current)
              ? current
              : firstAvailableDate
          );
        }
      }
      setLoading(false);
    };
    void run();
  }, [doctorId]);

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
  const nextAvailable = availableDates[0];

  const changeDate = (delta: number) => {
    const date = new Date(`${viewDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + delta);
    setViewDate(date.toISOString().slice(0, 10));
  };

  if (!loading && !doctor) {
    return (
      <div className="container-editorial flex min-h-[60vh] items-center py-20">
        <div>
          <p className="eyebrow">Profile unavailable</p>
          <h1 className="mt-4 font-serif text-4xl text-ink">This doctor could not be found.</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            The profile may have been removed from the directory. The full list is still available.
          </p>
          <button type="button" onClick={() => navigate('/doctors')} className="btn btn-primary mt-6">
            Browse doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <section className="container-editorial pb-14 pt-8 lg:pb-20 lg:pt-12">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All doctors
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <div className="border border-line bg-white">
              {loading ? (
                <Skeleton className="aspect-[4/3] w-full" />
              ) : doctor?.avatarUrl ? (
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="relative flex aspect-[4/3] items-center justify-center bg-sage">
                  <span className="font-serif text-[8rem] leading-none text-pine/80" aria-hidden="true">
                    {doctor ? doctorInitial(doctor.name) : ''}
                  </span>
                  <span className="absolute bottom-4 left-4 bg-white px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">
                    {doctor?.specialty}
                  </span>
                </div>
              )}

              <div className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : doctor ? (
                  <>
                    <h1 className="font-serif text-3xl leading-tight text-ink">{doctor.name}</h1>
                    <p className="mt-1 text-sm text-muted">{doctor.specialty}</p>

                    <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted">Experience</dt>
                        <dd className="font-mono tabular-nums text-ink">
                          {doctor.experience ? `${doctor.experience} yrs` : 'Not listed'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-muted">Consultation</dt>
                        <dd className="font-mono tabular-nums text-ink">${doctor.consultationFee}</dd>
                      </div>
                      {hospital ? (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted">Hospital</dt>
                          <dd className="text-right text-ink">{hospital.name}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {doctor.education ? (
                      <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                        {doctor.education}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => navigate(`/booking/${doctor.id}`)}
                      className="btn btn-primary mt-6 w-full"
                    >
                      Book appointment
                    </button>
                    <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                      Slot is claimed at booking
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <p className="eyebrow">Profile</p>
            <h2 className="mt-3 max-w-[18ch] font-serif text-[clamp(2.4rem,4.4vw,4.4rem)] leading-[0.95] tracking-[-0.03em] text-ink">
              {loading ? 'Loading specialist' : `Meet ${doctor?.name}.`}
            </h2>

            <div className="mt-6 border-t border-line pt-6">
              <p className="eyebrow">About</p>
              {loading ? (
                <div className="mt-3 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">{doctor?.bio}</p>
              )}
            </div>

            <div className="mt-10 border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <p className="eyebrow">Availability / next 14 days</p>
                {nextAvailable && !loading ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-pine">
                    Next open {formatDate(nextAvailable, { month: 'short', day: 'numeric' })}
                  </p>
                ) : null}
              </div>

              <div className="p-5">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-12" />
                      ))}
                    </div>
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="font-serif text-2xl text-ink">No open slots in the next two weeks.</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      The hospital has not published availability for this period. Browse other
                      specialists or try again later.
                    </p>
                    <Link to="/doctors" className="btn btn-outline mt-5">
                      Browse doctors
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {availableDates.slice(0, 10).map((date) => {
                        const active = date === viewDate;
                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setViewDate(date)}
                            aria-pressed={active}
                            className={`flex min-h-14 min-w-[4.25rem] flex-col items-center justify-center border px-2 py-1.5 transition-colors ${
                              active
                                ? 'border-pine bg-pine text-canvas'
                                : 'border-line bg-canvas text-ink hover:border-pine'
                            }`}
                          >
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] opacity-70">
                              {formatDate(date, { weekday: 'short' })}
                            </span>
                            <span className="mt-0.5 font-serif text-xl leading-none tabular-nums">
                              {formatDate(date, { day: 'numeric' })}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-y border-line py-2">
                      <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-pine"
                        aria-label="Previous day"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <div className="text-center">
                        <p className="font-serif text-lg text-ink">
                          {formatDate(viewDate, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted" aria-live="polite">
                          {slotsForDate.length > 0
                            ? `${slotsForDate.length} slot${slotsForDate.length === 1 ? '' : 's'} open`
                            : 'No slots open'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeDate(1)}
                        className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-pine"
                        aria-label="Next day"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {slotsForDate.length > 0 ? (
                      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slotsForDate.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() =>
                              navigate(`/booking/${doctorId}?slot=${encodeURIComponent(slot.startAt)}`)
                            }
                            className="min-h-11 border border-line bg-canvas px-2 py-2 font-mono text-xs tabular-nums text-ink transition-colors hover:border-pine hover:bg-pine hover:text-canvas focus-visible:border-pine focus-visible:bg-pine focus-visible:text-canvas"
                          >
                            {formatTime(slot.startAt)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 py-8 text-center">
                        <p className="text-sm text-muted">No slots on this day.</p>
                        {nextAvailable ? (
                          <button
                            type="button"
                            onClick={() => setViewDate(nextAvailable)}
                            className="link-line mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-pine"
                          >
                            Jump to {formatDate(nextAvailable, { month: 'short', day: 'numeric' })}
                          </button>
                        ) : null}
                      </div>
                    )}

                    <p className="mt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-muted">
                      Slots come from the hospital schedule. Choosing one carries it into booking.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
