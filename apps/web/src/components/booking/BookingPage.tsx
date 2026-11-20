import { useMemo, useState, useEffect, useRef, type FC } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointments } from '../../contexts/appointmentStore';
import { useAuth } from '../../contexts/authStore';
import { Doctor } from '../../types';
import { doctorInitial } from '../../utils/doctorInitial';

export const BookingPage: FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  const requestedSlot = searchParams.get('slot');
  const navigate = useNavigate();
  const location = useLocation();
  const { getDoctorById, getDoctorAvailability, bookAppointment } = useAppointments();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Array<{ id: string; startAt: string }>>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const run = async () => {
      if (!doctorId) return;
      setLoadingDoctor(true);
      const foundDoctor = await getDoctorById(doctorId);
      setDoctor(foundDoctor);
      setLoadingDoctor(false);

      const now = new Date();
      const from = now.toISOString().slice(0, 10);
      const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const items = await getDoctorAvailability(doctorId, from, to);
      setAvailability(items);

      if (requestedSlot && items.some((item) => item.startAt === requestedSlot)) {
        setSelectedDate(requestedSlot.slice(0, 10));
        setSelectedSlotStartAt(requestedSlot);
      } else if (items.length > 0) {
        setSelectedDate(items[0].startAt.slice(0, 10));
      }
    };
    void run();
  }, [doctorId, requestedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmedAt) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (dialog.open) {
      dialog.close();
    }
  }, [confirmedAt]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, Array<{ id: string; startAt: string }>>();
    for (const item of availability) {
      const date = new Date(item.startAt).toISOString().slice(0, 10);
      const list = map.get(date) ?? [];
      list.push(item);
      map.set(date, list);
    }
    for (const [key, value] of map.entries()) {
      value.sort((a, b) => a.startAt.localeCompare(b.startAt));
      map.set(key, value);
    }
    return map;
  }, [availability]);

  const availableDates = useMemo(() => Array.from(availabilityByDate.keys()).sort(), [availabilityByDate]);
  const availableTimesForDate = availabilityByDate.get(selectedDate) ?? [];

  const formatDate = (dateString: string) =>
    new Date(`${dateString}T12:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });

  const formatSlotTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <div className="bg-canvas">
        <div className="container-editorial flex min-h-[65vh] items-center py-20">
          <div className="max-w-xl">
            <p className="eyebrow">Sign in required</p>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.03em] text-ink">
              Slots are claimed by a patient account.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Sign in to hold this time, or create a patient account first. Your booking page will be
              waiting when you return.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/auth', { state: { from: returnTo } })}
                className="btn btn-primary"
              >
                Sign in to book
              </button>
              <button type="button" onClick={() => navigate('/doctors')} className="btn btn-outline">
                Browse doctors
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDoctor) {
    return (
      <div className="container-editorial py-16">
        <div className="h-4 w-28 animate-pulse bg-stone" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="aspect-[4/3] animate-pulse bg-stone" />
            <div className="h-8 w-2/3 animate-pulse bg-stone" />
            <div className="h-4 w-1/2 animate-pulse bg-stone" />
          </div>
          <div className="space-y-4 lg:col-span-7 lg:col-start-6">
            <div className="h-10 w-1/2 animate-pulse bg-stone" />
            <div className="h-14 w-full animate-pulse bg-stone" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse bg-stone" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container-editorial flex min-h-[60vh] items-center py-20">
        <div>
          <p className="eyebrow">Booking unavailable</p>
          <h1 className="mt-4 font-serif text-4xl text-ink">This doctor could not be found.</h1>
          <button type="button" onClick={() => navigate('/doctors')} className="btn btn-primary mt-6">
            Browse doctors
          </button>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlotStartAt || !reason.trim()) {
      toast.error('Choose a date, a time, and add a reason for the visit');
      return;
    }
    setIsBooking(true);
    const ok = await bookAppointment({ doctorId: doctor.id, slotStartAt: selectedSlotStartAt, reason: reason.trim() });
    setIsBooking(false);
    if (ok) {
      setConfirmedAt(selectedSlotStartAt);
    } else {
      toast.error('That slot is no longer available. Choose another time.');
      const now = new Date();
      const items = await getDoctorAvailability(
        doctor.id,
        now.toISOString().slice(0, 10),
        new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10)
      );
      setAvailability(items);
      setSelectedSlotStartAt(null);
    }
  };

  const closeDialog = () => setConfirmedAt(null);

  return (
    <div className="bg-canvas">
      <section className="container-editorial pb-16 pt-8 lg:pb-24 lg:pt-12">
        <button
          type="button"
          onClick={() => navigate(`/doctors/${doctor.id}`)}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to profile
        </button>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <div className="sticky top-28 border border-line bg-white">
              <div className="flex items-center gap-4 border-b border-line p-5">
                {doctor.avatarUrl ? (
                  <img src={doctor.avatarUrl} alt={doctor.name} className="h-16 w-16 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center bg-sage">
                    <span className="font-serif text-2xl text-pine">{doctorInitial(doctor.name)}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="font-serif text-2xl leading-tight text-ink">{doctor.name}</h1>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-coral">
                    {doctor.specialty}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Experience</dt>
                  <dd className="font-mono tabular-nums text-ink">
                    {doctor.experience ? `${doctor.experience} yrs` : 'Not listed'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Consultation</dt>
                  <dd className="font-mono tabular-nums text-ink">${doctor.consultationFee}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Open slots</dt>
                  <dd className="font-mono tabular-nums text-ink">{availability.length}</dd>
                </div>
              </dl>

              <p className="border-t border-line p-5 text-xs leading-relaxed text-muted">{doctor.bio}</p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <p className="eyebrow">Booking / step 1 of 2</p>
            <h2 className="mt-4 max-w-[14ch] font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[0.92] tracking-[-0.04em] text-ink">
              Choose the <span className="italic text-coral">time.</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              Availability below comes from the hospital schedule. The slot is yours once you confirm.
            </p>

            <div className="mt-9 border border-line bg-white">
              <div className="border-b border-line p-5">
                <p className="eyebrow">Date</p>
                {availableDates.length === 0 ? (
                  <div className="mt-4">
                    <p className="font-serif text-2xl text-ink">No open dates in the next two weeks.</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      The hospital has not published availability for this doctor. Try another specialist.
                    </p>
                    <button type="button" onClick={() => navigate('/doctors')} className="btn btn-outline mt-4">
                      Browse doctors
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                    {availableDates.map((date) => {
                      const active = selectedDate === date;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date);
                            if (selectedSlotStartAt && selectedSlotStartAt.slice(0, 10) !== date) {
                              setSelectedSlotStartAt(null);
                            }
                          }}
                          aria-pressed={active}
                          className={`flex min-h-16 min-w-[4.5rem] shrink-0 flex-col items-center justify-center border px-2 py-2 transition-colors ${
                            active
                              ? 'border-pine bg-pine text-canvas'
                              : 'border-line bg-canvas text-ink hover:border-pine'
                          }`}
                        >
                          <span className="font-mono text-[8px] uppercase tracking-[0.12em] opacity-70">
                            {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
                              weekday: 'short',
                              timeZone: 'UTC',
                            })}
                          </span>
                          <span className="mt-0.5 font-serif text-xl leading-none tabular-nums">
                            {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
                              day: 'numeric',
                              timeZone: 'UTC',
                            })}
                          </span>
                          <span className="font-mono text-[8px] uppercase tracking-[0.1em] opacity-60">
                            {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
                              month: 'short',
                              timeZone: 'UTC',
                            })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {availableDates.length > 0 && (
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="eyebrow">Time</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                      {formatDate(selectedDate)}
                    </p>
                  </div>

                  {availableTimesForDate.length > 0 ? (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {availableTimesForDate.map((slot) => {
                        const active = selectedSlotStartAt === slot.startAt;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotStartAt(slot.startAt)}
                            aria-pressed={active}
                            className={`min-h-12 border px-2 py-2 font-mono text-sm tabular-nums transition-colors ${
                              active
                                ? 'border-pine bg-pine text-canvas'
                                : 'border-line bg-canvas text-ink hover:border-pine'
                            }`}
                          >
                            {formatSlotTime(slot.startAt)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 border border-line bg-canvas px-4 py-6 text-sm text-muted">
                      No slots open on this date. Choose another date above.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8">
              <p className="eyebrow">Step 2 / reason for visit</p>
              <label htmlFor="reason" className="mt-3 block font-serif text-2xl text-ink">
                What should the doctor know?
              </label>
              <textarea
                id="reason"
                rows={4}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-3 w-full border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted/60 focus:border-pine focus:outline-none"
                placeholder="A short note for the consultation. Do not include sensitive medical records."
              />
              <div className="mt-1 flex justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                <span>Demo data only</span>
                <span className="tabular-nums">{reason.length} / 500</span>
              </div>
            </div>

            <div className="mt-8 border border-line bg-white">
              <div className="border-b border-line px-5 py-4">
                <p className="eyebrow">Summary</p>
              </div>
              <dl className="space-y-3 p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Doctor</dt>
                  <dd className="text-right text-ink">{doctor.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Date</dt>
                  <dd className="text-right text-ink">
                    {selectedDate ? formatDate(selectedDate) : 'Not selected'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Time</dt>
                  <dd className="font-mono tabular-nums text-right text-ink">
                    {selectedSlotStartAt ? formatSlotTime(selectedSlotStartAt) : 'Not selected'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3">
                  <dt className="text-muted">Consultation fee</dt>
                  <dd className="font-mono tabular-nums text-ink">${doctor.consultationFee}</dd>
                </div>
              </dl>
              <div className="border-t border-line p-5">
                <button
                  type="button"
                  onClick={() => void handleBooking()}
                  disabled={!selectedDate || !selectedSlotStartAt || !reason.trim() || isBooking}
                  className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isBooking ? 'Holding the slot…' : 'Confirm appointment'}
                </button>
                <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  One slot can only be claimed once
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="booking-confirmed-title"
        onClose={closeDialog}
        className="w-[min(92vw,32rem)] border border-line bg-canvas p-0 text-ink backdrop:bg-ink/50"
      >
        <div className="p-7">
          <span className="flex h-11 w-11 items-center justify-center bg-pine text-canvas">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="booking-confirmed-title" className="mt-5 font-serif text-3xl leading-tight">
            Appointment held.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {doctor.name} · {confirmedAt ? formatDate(confirmedAt.slice(0, 10)) : formatDate(selectedDate)} at{' '}
            {confirmedAt ? formatSlotTime(confirmedAt) : selectedSlotStartAt ? formatSlotTime(selectedSlotStartAt) : ''}.
            The time is now marked booked in the hospital schedule.
          </p>
          <div className="mt-6 grid gap-2">
            <button
              type="button"
              onClick={() => {
                closeDialog();
                navigate('/dashboard');
              }}
              className="btn btn-primary"
            >
              View my appointments
            </button>
            <button
              type="button"
              onClick={() => {
                closeDialog();
                navigate('/doctors');
              }}
              className="btn btn-outline"
            >
              Book another doctor
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};
