import { useState, type FC } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/authStore';

type Mode = 'sign-in' | 'create';

export const AuthPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';
  const [mode, setMode] = useState<Mode>('sign-in');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const { login, register, loading } = useAuth();

  const isLogin = mode === 'sign-in';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isLogin) {
      const success = await login(formData.email.trim(), formData.password);
      if (success) {
        toast.success('Signed in');
        navigate(from, { replace: true });
      } else {
        toast.error('Invalid email or password');
      }
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Use at least 8 characters for the password');
      return;
    }

    const success = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
    });
    if (success) {
      toast.success('Account created');
      navigate(from, { replace: true });
    } else {
      toast.error('Registration failed. Check your details and try again.');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const inputClass =
    'mt-2 min-h-12 w-full border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/60 focus:border-pine focus:outline-none';

  return (
    <div className="bg-canvas">
      <div className="container-editorial grid min-h-[calc(100vh-5rem)] gap-12 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16">
        <aside className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="eyebrow">Patient access</p>
            <h1 className="mt-5 max-w-[9ch] font-serif text-[clamp(3.4rem,6vw,6.5rem)] leading-[0.86] tracking-[-0.045em] text-ink">
              One account.
              <span className="mt-1 block italic text-coral">Every visit.</span>
            </h1>
            <p className="mt-8 max-w-sm text-base leading-relaxed text-muted">
              Book across partner hospitals, keep your appointment history in one place, and cancel a
              slot so someone else can use it.
            </p>
          </div>

          <dl className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine">One identity</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                The same patient account follows you across hospitals.
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine">One schedule</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Your booked times stay tied to the hospital’s real calendar.
              </dd>
            </div>
          </dl>

          <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
            Portfolio demo · Seeded hospitals · Do not enter medical information
          </p>
        </aside>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="border border-line bg-white">
            <div className="grid grid-cols-2 border-b border-line">
              {(['sign-in', 'create'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  aria-pressed={mode === item}
                  className={`min-h-12 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    mode === item
                      ? 'bg-ink text-canvas'
                      : 'text-muted hover:bg-stone/50 hover:text-ink'
                  }`}
                >
                  {item === 'sign-in' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-9">
              <p className="eyebrow">{isLogin ? 'Welcome back' : 'New patient'}</p>
              <h2 className="mt-3 font-serif text-[clamp(2.2rem,3.4vw,3.2rem)] leading-[0.95] tracking-[-0.03em] text-ink">
                {isLogin ? 'Sign in to your visits.' : 'Open a patient account.'}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {isLogin
                  ? 'Your appointments, past visits, and cancellations live here.'
                  : 'Create an account to hold a slot. You can book immediately after this step.'}
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div>
                      <label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                        Phone <span className="normal-case tracking-normal text-muted">(optional)</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Contact number for the clinic"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`${inputClass} pr-12`}
                      placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
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

                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`${inputClass} pr-12`}
                        placeholder="Repeat the password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                        className="absolute right-0 top-2 flex h-12 w-12 items-center justify-center text-muted transition-colors hover:text-ink"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
                  {loading ? 'Working…' : isLogin ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <p className="mt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-muted">
                Patient accounts only. Hospital staff sign in through the admin portal.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link to="/doctors" className="link-line font-mono text-[10px] uppercase tracking-[0.14em] text-pine">
              Browse doctors first
            </Link>
            <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
