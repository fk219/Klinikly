import { useEffect, useRef, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiError } from '@app/shared';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  History,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/authStore';
import { useAppointments } from '../../contexts/appointmentStore';
import { apiSearchDoctors } from '../../api/search';
import { gsap } from 'gsap';

export const HomePage: FC = () => {
  const { user } = useAuth();
  const { hospitals } = useAppointments();
  const [doctorCount, setDoctorCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!heroRef.current) return;

    const tl = gsap.timeline();
    tl.fromTo('.hero-title', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })
      .fromTo('.hero-subtitle', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.5')
      .fromTo('.hero-buttons', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3');
  }, []);

  useEffect(() => {
    let active = true;

    void apiSearchDoctors({ page: 1, limit: 1 }).then((res) => {
      if (!active || isApiError(res)) return;
      setDoctorCount(res.data.total);
    });

    return () => {
      active = false;
    };
  }, []);

  const features = [
    {
      icon: CalendarCheck,
      title: 'Real availability',
      description: 'Every slot is generated from a doctor schedule, so the times you see can actually be booked.',
    },
    {
      icon: ShieldCheck,
      title: 'One booking per slot',
      description: 'A slot is claimed atomically. Two patients cannot reserve the same appointment.',
    },
    {
      icon: History,
      title: 'Your appointment history',
      description: 'See upcoming and past visits in one dashboard, and cancel while a visit is still scheduled.',
    },
    {
      icon: Building2,
      title: 'Hospital-scoped admin',
      description: 'Each hospital manages only its own doctors, availability rules, and appointments.',
    },
  ];

  const hospitalCount = hospitals.length > 0 ? hospitals.length : '...';
  const shownDoctorCount = doctorCount ?? '...';

  return (
    <div className="min-h-screen bg-white">
      <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            <h1 className="hero-title text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Book the right doctor,
              <span className="block text-emerald-200">at a time that actually exists.</span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl text-teal-50 mb-8 max-w-3xl leading-relaxed">
              Search seeded hospitals, compare specialists, and reserve a slot from real schedules.
            </p>
            <div className="hero-buttons flex flex-col sm:flex-row gap-4">
              {user ? (
                <>
                  <Button size="lg" onClick={() => navigate('/doctors')} className="bg-white text-teal-700 hover:bg-gray-50">
                    <CalendarCheck className="mr-2 h-5 w-5" /> Find a doctor <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')} className="border-white text-white hover:bg-white hover:text-teal-700">
                    My appointments
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/auth')} className="bg-white text-teal-700 hover:bg-gray-50">
                    <CalendarCheck className="mr-2 h-5 w-5" /> Create a patient account <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/doctors')} className="border-white text-white hover:bg-white hover:text-teal-700">
                    Browse doctors
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600">
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-600" /> {hospitalCount} hospitals</span>
          <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-teal-600" /> {shownDoctorCount} doctors</span>
          <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-teal-600" /> Rolling 30-day availability</span>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
            Seeded demo data
          </span>
        </div>
      </div>

      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 mb-3">How the demo works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built around real availability</h2>
            <p className="text-lg text-gray-600">
              No mock calendar and no double-booked slots. The demo exercises the same booking flow a patient would use.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card flex gap-5 rounded-2xl border border-gray-200 p-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-16 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 mb-3">Booking flow</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">From search to confirmed slot</h2>
            <p className="text-lg text-gray-600">
              Three steps, each backed by the seeded hospital schedule.
            </p>
          </div>

          <ol className="relative border-l border-teal-200 pl-8 space-y-10">
            <li>
              <span className="text-sm font-semibold text-teal-700">01</span>
              <h3 className="text-xl font-semibold text-gray-900 mt-1 mb-2">Find a specialist</h3>
              <p className="text-gray-600">Filter by name or specialty, then open a doctor profile to see the full schedule.</p>
            </li>
            <li>
              <span className="text-sm font-semibold text-teal-700">02</span>
              <h3 className="text-xl font-semibold text-gray-900 mt-1 mb-2">Pick a real slot</h3>
              <p className="text-gray-600">The calendar reads generated availability, not a hard-coded mock list.</p>
            </li>
            <li>
              <span className="text-sm font-semibold text-teal-700">03</span>
              <h3 className="text-xl font-semibold text-gray-900 mt-1 mb-2">Manage the appointment</h3>
              <p className="text-gray-600">See it in your dashboard. Cancel it and the slot returns to the schedule.</p>
            </li>
          </ol>
        </div>
      </div>

      <div className="bg-teal-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Try the booking flow</h2>
            <p className="text-lg text-teal-50 mb-8">
              Create a demo patient account and reserve a slot from the seeded schedule.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(user ? '/doctors' : '/auth')}
              className="bg-white text-teal-700 hover:bg-gray-50"
            >
              {user ? 'Find another doctor' : 'Create a patient account'} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
