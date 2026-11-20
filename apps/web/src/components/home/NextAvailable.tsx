import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isApiError } from '@app/shared';
import { apiGetDoctorAvailability, apiSearchDoctors } from '../../api/search';
import { useAppointments } from '../../contexts/appointmentStore';
import type { Doctor, DoctorAvailabilityItem } from '../../types';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const formatSlotTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatDate = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });

const formatDayNumber = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric',
    timeZone: 'UTC',
  });

const NextAvailable = () => {
  const { hospitals } = useAppointments();
  const [range] = useState(() => {
    const now = new Date();
    return {
      from: toDateKey(now),
      to: toDateKey(new Date(now.getTime() + 7 * DAY_MS)),
    };
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availability, setAvailability] = useState<DoctorAvailabilityItem[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus('loading');
      const doctorsResponse = await apiSearchDoctors({ page: 1, limit: 4 });

      if (!active) return;
      if (isApiError(doctorsResponse) || doctorsResponse.data.items.length === 0) {
        setStatus('error');
        return;
      }

      const nextDoctors = doctorsResponse.data.items;
      const availabilityByDoctor = await Promise.all(
        nextDoctors.map(async (doctor) => {
          const slotsResponse = await apiGetDoctorAvailability(doctor.id, range.from, range.to);
          return {
            doctor,
            slots: isApiError(slotsResponse) ? [] : slotsResponse.data.items,
          };
        })
      );

      if (!active) return;

      const firstWithSlots = availabilityByDoctor.find((entry) => entry.slots.length > 0);
      const selected = firstWithSlots ?? availabilityByDoctor[0];

      setDoctors(nextDoctors);
      setSelectedDoctorId(selected.doctor.id);
      setAvailability(selected.slots);
      setStatus(selected.slots.length > 0 ? 'ready' : 'empty');
    };

    void load();

    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  const dates = useMemo(() => {
    const keys = Array.from(new Set(availability.map((slot) => slot.startAt.slice(0, 10)))).sort();
    return keys.slice(0, 4);
  }, [availability]);

  useEffect(() => {
    if (dates.length === 0) {
      setSelectedDate('');
      return;
    }
    setSelectedDate((current) => (dates.includes(current) ? current : dates[0]));
  }, [dates]);

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null;
  const selectedHospital = hospitals.find((hospital) => hospital.id === selectedDoctor?.hospitalId);
  const slots = availability
    .filter((slot) => slot.startAt.slice(0, 10) === selectedDate)
    .slice(0, 3);

  const handleDoctorChange = async (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setStatus('loading');

    const slotsResponse = await apiGetDoctorAvailability(doctorId, range.from, range.to);
    if (isApiError(slotsResponse)) {
      setAvailability([]);
      setStatus('error');
      return;
    }

    setAvailability(slotsResponse.data.items);
    setStatus(slotsResponse.data.items.length > 0 ? 'ready' : 'empty');
  };

  return (
    <div className="border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-pine" aria-hidden="true" />
          <span className="eyebrow">Next available</span>
        </div>
        <Link to="/doctors" className="link-line font-mono text-[10px] uppercase tracking-[0.14em] text-pine">
          All doctors
        </Link>
      </div>

      <div className="px-5 py-5">
        {status === 'loading' && (
          <div className="space-y-4" aria-live="polite" aria-label="Loading availability">
            <div className="h-8 w-2/3 animate-pulse bg-stone" />
            <div className="h-4 w-1/2 animate-pulse bg-stone" />
            <div className="grid grid-cols-4 gap-2 pt-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse bg-stone" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-11 animate-pulse bg-stone" />
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8" role="status">
            <p className="font-serif text-2xl text-ink">Availability is temporarily unavailable.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The doctor list still works. Try again from the full directory.
            </p>
            <Link to="/doctors" className="btn btn-outline mt-5">
              Browse doctors
            </Link>
          </div>
        )}

        {status === 'empty' && (
          <div className="py-8" role="status">
            <p className="font-serif text-2xl text-ink">No slots in the next seven days.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Check another doctor or view the full directory.
            </p>
            <Link to="/doctors" className="btn btn-outline mt-5">
              Browse doctors
            </Link>
          </div>
        )}

        {status === 'ready' && selectedDoctor && (
          <div aria-live="polite">
            <label htmlFor="next-doctor" className="eyebrow block">
              Doctor
            </label>
            <select
              id="next-doctor"
              value={selectedDoctorId}
              onChange={(event) => void handleDoctorChange(event.target.value)}
              className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm text-ink focus:border-pine focus:outline-none"
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} · {doctor.specialty}
                </option>
              ))}
            </select>

            <div className="mt-5">
              <p className="font-serif text-2xl leading-tight text-ink">{selectedDoctor.name}</p>
              <p className="mt-1 text-sm text-muted">
                {selectedDoctor.specialty}
                {selectedHospital ? ` · ${selectedHospital.name}` : ''}
              </p>
            </div>

            <div className="mt-5">
              <p className="eyebrow">Date</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {dates.map((date) => {
                  const active = selectedDate === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      aria-pressed={active}
                      className={`min-h-16 border px-1 py-2 text-center transition-colors ${
                        active
                          ? 'border-pine bg-pine text-canvas'
                          : 'border-line bg-canvas text-ink hover:border-pine'
                      }`}
                    >
                      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] opacity-70">
                        {formatDate(date)}
                      </span>
                      <span className="mt-1 block font-serif text-xl leading-none">{formatDayNumber(date)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="eyebrow">Time</p>
              <div className="mt-2 border-t border-line">
                {slots.map((slot) => (
                  <Link
                    key={slot.id}
                    to={`/booking/${selectedDoctor.id}?slot=${encodeURIComponent(slot.startAt)}`}
                    className="group flex min-h-12 items-center justify-between border-b border-line py-3 transition-colors hover:bg-sage/50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
                      <span className="font-mono text-sm tabular-nums text-ink">{formatSlotTime(slot.startAt)}</span>
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted group-hover:text-pine">
                      Book slot
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <p className="mt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-muted">
              Real seeded availability. The slot is claimed at booking time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextAvailable;
