import { useState, type FC } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const patientSiteUrl = import.meta.env.VITE_PATIENT_URL ?? 'http://localhost:5173';

export const LoginPage: FC = () => {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const result = await login(email.trim(), password);
    if (!result.ok) setError(result.error ?? 'Login failed');
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center bg-pine font-serif text-lg text-canvas">K</span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-xl tracking-tight text-ink">Klinikly</span>
              <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted">Hospital portal</span>
            </span>
          </span>
          <a
            href={patientSiteUrl}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Patient site
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-stretch gap-0 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:py-14">
        <section className="hidden border border-line bg-ink p-10 text-canvas lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-canvas/40">Hospital administration</p>
            <h1 className="mt-5 max-w-[10ch] font-serif text-[clamp(2.8rem,4vw,4.2rem)] leading-[0.9] tracking-[-0.04em]">
              Every slot has an <span className="italic text-coral">owner.</span>
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-canvas/60">
              Manage your hospital’s doctors, publish weekly schedules, generate slots, and keep the
              appointment record accurate.
            </p>
          </div>

          <ol className="space-y-4 border-t border-canvas/10 pt-6">
            {[
              ['Scoped access', 'Each administrator only sees their own hospital.'],
              ['Real schedules', 'Weekly templates generate the same slots patients book.'],
              ['Accurate records', 'Cancel or complete an appointment and the slot follows.'],
            ].map(([title, body], index) => (
              <li key={title} className="grid grid-cols-[1.5rem_1fr] gap-3">
                <span className="font-mono text-[9px] tracking-[0.12em] text-coral">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-serif text-lg leading-snug">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-canvas/50">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border border-line bg-white p-6 sm:p-9 lg:col-span-7">
          <p className="eyebrow">Administrator sign in</p>
          <h2 className="mt-3 font-serif text-[clamp(2.2rem,3.2vw,3.2rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Open the hospital desk.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Use your hospital administrator account. Patient accounts cannot access this portal.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
            <div>
              <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted/60 focus:border-pine focus:outline-none"
                placeholder="admin@hospital.example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 pr-12 text-sm text-ink placeholder:text-muted/60 focus:border-pine focus:outline-none"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-2 flex h-12 w-12 items-center justify-center text-muted transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="border border-coral/30 bg-[#F7ECE6] px-4 py-3 text-sm text-coral" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center bg-pine px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 max-w-md border border-line bg-canvas p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-coral">Seeded demo administrator</p>
            <dl className="mt-3 space-y-1.5 font-mono text-[11px] text-ink">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted">Email</dt>
                <dd>admin@city-care-hospital.example.com</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted">Password</dt>
                <dd>Admin123!</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Demo data only. Do not enter real patient or medical information.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-2 px-5 py-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted sm:flex-row sm:px-8">
          <span>Klinikly · Multi-tenant appointment platform</span>
          <span>Portfolio demo · Seeded data</span>
        </div>
      </footer>
    </div>
  );
};
