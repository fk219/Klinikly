import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../../contexts/authStore';

const navItems = [
  { label: 'Doctors', to: '/doctors' },
  { label: 'How it works', to: '/#how' },
  { label: 'For hospitals', to: '/#platform' },
  { label: 'My appointments', to: '/dashboard' },
];

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return undefined;

    if (menuOpen) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    } else {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="container-editorial flex h-16 items-center justify-between gap-3 lg:h-20 lg:gap-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Klinikly home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-pine text-canvas sm:h-10 sm:w-10">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-xl tracking-tight text-ink sm:text-2xl">Klinikly</span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted sm:block">
              Care, scheduled.
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `link-line font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  isActive ? 'text-pine' : 'text-muted hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <div className="hidden items-center gap-4 lg:flex">
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-pine">
                  <User className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="max-w-28 truncate">{user.name}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="hidden lg:inline-flex btn btn-outline">
              Sign in
            </Link>
          )}

          <Link to="/doctors" className="hidden lg:inline-flex btn btn-primary">
            Book a doctor
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="klinikly-menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        ref={menuRef}
        id="klinikly-menu"
        aria-label="Site menu"
        onClose={() => setMenuOpen(false)}
        className="m-0 h-full w-full max-w-none border-0 bg-canvas p-0 text-ink backdrop:bg-canvas lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="container-editorial flex h-16 items-center justify-between border-b border-line">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center bg-pine text-canvas">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-serif text-xl tracking-tight">Klinikly</span>
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center text-ink"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile primary" className="container-editorial flex flex-1 flex-col justify-center gap-1 py-8">
            {navItems.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-baseline gap-4 border-b border-line py-5 font-serif text-4xl tracking-tight text-ink transition-colors hover:text-coral sm:text-5xl"
              >
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="container-editorial border-t border-line py-6">
            {user ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted">Signed in as {user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn btn-primary w-full">
                Sign in or create an account
              </Link>
            )}
            <Link to="/doctors" className="btn btn-outline mt-3 w-full">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Book a doctor
            </Link>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Portfolio demo · Seeded data
            </p>
          </div>
        </div>
      </dialog>
    </header>
  );
};
