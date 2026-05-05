import type { WeeklyTemplate } from '../db/models/AvailabilityRule';

const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const parseDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

const parseTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return { h, m };
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

export const generateSlots = (params: {
  from: string;
  to: string;
  slotDurationMinutes: number;
  weeklyTemplate: WeeklyTemplate;
}) => {
  const fromDate = parseDate(params.from);
  const toDate = parseDate(params.to);

  const out: Date[] = [];
  for (let d = new Date(fromDate); d.getTime() <= toDate.getTime(); d = addMinutes(d, 24 * 60)) {
    const dayKey = dayKeys[d.getUTCDay()];
    const windows = params.weeklyTemplate[dayKey] ?? [];

    for (const w of windows) {
      const start = parseTime(w.start);
      const end = parseTime(w.end);

      const windowStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), start.h, start.m));
      const windowEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), end.h, end.m));

      for (let t = new Date(windowStart); t.getTime() + params.slotDurationMinutes * 60_000 <= windowEnd.getTime(); t = addMinutes(t, params.slotDurationMinutes)) {
        out.push(new Date(t));
      }
    }
  }

  return out;
};

