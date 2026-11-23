import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, LayoutDashboard, Users, Calendar, CalendarClock, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/doctors', icon: Users, label: 'Doctors' },
  { to: '/availability', icon: CalendarClock, label: 'Availability' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
];

export const Sidebar: FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-canvas/10 bg-ink text-canvas lg:w-64">
      <NavLink to="/dashboard" className="flex h-16 items-center gap-3 border-b border-canvas/10 px-4 lg:h-20 lg:px-6" aria-label="Klinikly hospital portal">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-canvas text-ink">
          <Clock className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="hidden flex-col leading-none lg:flex">
          <span className="font-serif text-2xl tracking-tight">Klinikly</span>
          <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-canvas/50">
            Hospital portal
          </span>
        </span>
      </NavLink>

      <div className="hidden border-b border-canvas/10 px-6 py-4 lg:block">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-canvas/40">Signed in</p>
        <p className="mt-1 truncate text-sm text-canvas/80">{user?.name}</p>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 lg:px-3" aria-label="Hospital portal">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            aria-label={label}
            className={({ isActive }: { isActive: boolean }) =>
              `flex min-h-11 items-center gap-3 border-l-2 px-3 transition-colors ${
                isActive
                  ? 'border-coral bg-canvas/10 text-canvas'
                  : 'border-transparent text-canvas/55 hover:bg-canvas/5 hover:text-canvas'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-canvas/10 p-2 lg:p-3">
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Sign out"
          className="flex min-h-11 w-full items-center gap-3 border-l-2 border-transparent px-3 text-canvas/55 transition-colors hover:bg-canvas/5 hover:text-coral"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] lg:inline">Sign out</span>
        </button>
      </div>
    </aside>
  );
};
