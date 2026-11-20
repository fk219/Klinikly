import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NextAvailable from './NextAvailable';

const specialties = [
  { name: 'Cardiology', note: 'Heart and vascular care' },
  { name: 'Neurology', note: 'Brain and nervous system' },
  { name: 'Dermatology', note: 'Skin, hair, and nails' },
  { name: 'Orthopedics', note: 'Bones, joints, and mobility' },
];

const steps = [
  {
    title: 'Find a specialist',
    body: 'Search by name or specialty. Every doctor profile lists their hospital and consultation fee.',
  },
  {
    title: 'Pick a real slot',
    body: 'The calendar reads generated availability from the hospital schedule, not a request form.',
  },
  {
    title: 'Keep the appointment',
    body: 'The slot is claimed atomically. Cancel it and the time returns to the schedule.',
  },
];

export const HomePage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash !== '#how') return undefined;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById('how');
      if (!target) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <div className="bg-canvas">
      <section className="container-editorial pb-16 pt-10 lg:pb-24 lg:pt-16" aria-labelledby="home-title">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7 lg:pt-4">
            <p className="eyebrow">Appointments / Multi-tenant care</p>

            <h1
              id="home-title"
              className="mt-6 max-w-[10ch] font-serif text-[clamp(3.8rem,9vw,8rem)] leading-[0.86] tracking-[-0.045em] text-ink"
            >
              Care,
              <span className="block italic text-coral">scheduled.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Compare specialists, see real availability from hospital schedules, and claim a slot that
              actually exists.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/doctors" className="btn btn-primary">
                Find a doctor
              </Link>
              <a href="#how" className="btn btn-outline">
                How booking works
              </a>
            </div>

            <div className="mt-12 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
              {[
                ['Real slots', 'Generated from hospital schedules.'],
                ['One booking', 'A slot can only be claimed once.'],
                ['Scoped admin', 'Each hospital manages its own data.'],
              ].map(([title, body]) => (
                <div key={title}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <NextAvailable />
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 border-y border-line bg-stone/60 py-20 lg:py-24" aria-labelledby="how-title">
        <div className="container-editorial grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow">The booking rail</p>
            <h2 id="how-title" className="mt-4 max-w-[12ch] font-serif text-[clamp(2.6rem,4.4vw,4.5rem)] leading-[0.95] tracking-[-0.03em] text-ink">
              Three steps, one honest calendar.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted">
              No callback queue. No “we will confirm your request.” The time you choose is the time that is
              held.
            </p>
          </div>

          <ol className="lg:col-span-7 lg:col-start-6">
            {steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-6 last:border-b">
                <span className="font-mono text-[10px] tracking-[0.14em] text-coral">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-serif text-2xl text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-editorial py-20 lg:py-24" aria-labelledby="specialties-title">
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Specialties</p>
            <h2 id="specialties-title" className="mt-4 max-w-[14ch] font-serif text-[clamp(2.6rem,4.5vw,4.6rem)] leading-[0.95] tracking-[-0.03em] text-ink">
              Start with the right specialist.
            </h2>
          </div>
          <Link to="/doctors" className="link-line font-mono text-[10px] uppercase tracking-[0.16em] text-pine">
            View all doctors
          </Link>
        </div>

        <div className="mt-8 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {specialties.map((specialty, index) => (
            <Link
              key={specialty.name}
              to={`/doctors?specialty=${encodeURIComponent(specialty.name)}`}
              className="group border-b border-line py-6 pr-4 transition-colors hover:bg-sage/40 sm:px-4 lg:border-b-0 lg:border-r lg:last:border-r-0"
            >
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-4 font-serif text-3xl text-ink transition-colors group-hover:text-pine">
                {specialty.name}
              </p>
              <p className="mt-2 text-sm text-muted">{specialty.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="platform" className="scroll-mt-24 bg-ink py-20 text-canvas lg:py-24" aria-labelledby="platform-title">
        <div className="container-editorial grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-canvas/50">For hospitals</p>
            <h2 id="platform-title" className="mt-4 max-w-[12ch] font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[0.92] tracking-[-0.04em]">
              Two sides of one appointment.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-canvas/65">
              The patient app and the hospital portal share the same schedule model. That is what makes the
              booking real.
            </p>
          </div>

          <div className="grid gap-8 lg:col-span-6 lg:col-start-7 sm:grid-cols-2">
            <div className="border-t border-canvas/15 pt-5">
              <h3 className="font-serif text-2xl">Patient app</h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-canvas/65">
                <li>Search by specialty</li>
                <li>See live availability</li>
                <li>Book and cancel appointments</li>
              </ul>
            </div>
            <div className="border-t border-canvas/15 pt-5">
              <h3 className="font-serif text-2xl">Hospital portal</h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-canvas/65">
                <li>Doctor and profile management</li>
                <li>Weekly schedule templates</li>
                <li>Slot generation and blocking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container-editorial py-20 lg:py-24" aria-labelledby="cta-title">
        <div className="flex flex-col justify-between gap-8 border-b border-line pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Seeded demo data</p>
            <h2 id="cta-title" className="mt-4 font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[0.95] tracking-[-0.03em] text-ink">
              Open the calendar.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Create a demo patient account and book a slot from the seeded hospital schedule. Do not enter
              personal or medical information.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/doctors" className="btn btn-primary">
              Find a doctor
            </Link>
            <Link to="/auth" className="btn btn-outline">
              Create a patient account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
