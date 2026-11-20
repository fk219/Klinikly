import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { Stethoscope, LayoutDashboard, Users, Calendar, CalendarClock, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctors', icon: Users, label: 'Doctors' },
  { to: '/availability', icon: CalendarClock, label: 'Availability' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
];

export const Sidebar: FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Klinikly</p>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Hospital name */}
      {user && (
        <div className="px-6 py-3 border-b border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Logged in as</p>
          <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={() => void logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-900/40 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
