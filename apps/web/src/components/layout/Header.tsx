import { useState, useEffect, useRef, type FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  Calendar,
  Stethoscope,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/authStore';
import { Button } from '../common/Button';
import { gsap } from 'gsap';

export const Header: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
    }
    if (logoRef.current) {
      gsap.fromTo(logoRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'My Appointments', path: '/dashboard' },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      ref={headerRef}
      className="bg-white/95 backdrop-blur-md shadow-lg border-b border-teal-100 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div ref={logoRef} className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <div className="relative">
                <Stethoscope className="h-8 w-8 text-teal-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Klinikly
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActive(item.path)
                    ? 'text-teal-600 bg-teal-50 shadow-sm'
                    : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors p-2 rounded-full hover:bg-teal-50"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600"
                    >
                      <Calendar className="h-4 w-4 mr-3" />
                      My Appointments
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => navigate('/auth')} size="sm">
                Sign In
              </Button>
            )}

            {/* Hamburger */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-teal-600 transition-colors rounded-full hover:bg-teal-50"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block w-full text-left px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
