import { useState, useEffect, useRef, type FC } from 'react';
import {
  User,
  LogOut,
  Calendar,
  Stethoscope,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/authStore';
import { Button } from '../common/Button';
import { gsap } from 'gsap';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current && logoRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo(
        logoRef.current,
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: 'back.out(1.7)',
          delay: 0.3,
        }
      );
    }
  }, []);

  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'Doctors', id: 'doctors' },
    { name: 'My Appointments', id: 'dashboard' },
  ];

  const notifications = [
    {
      id: 1,
      message: 'Appointment reminder: Dr. Johnson tomorrow at 2:00 PM',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      message: 'Lab results are now available',
      time: '1 day ago',
      unread: true,
    },
    {
      id: 3,
      message: 'Annual checkup due next month',
      time: '3 days ago',
      unread: false,
    },
  ];

  return (
    <header
      ref={headerRef}
      className="bg-white/95 backdrop-blur-md shadow-lg border-b border-teal-100 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div
              ref={logoRef}
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <div className="relative">
                <Stethoscope className="h-8 w-8 text-teal-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Klinikly
              </span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  currentPage === item.id
                    ? 'text-teal-600 bg-teal-50 shadow-sm'
                    : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* User Actions and Hamburger */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-600 hover:text-teal-600 transition-colors rounded-full hover:bg-teal-50"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              notification.unread ? 'bg-teal-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-800">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors p-2 rounded-full hover:bg-teal-50"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.name}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600"
                    >
                      <Calendar className="h-4 w-4 mr-3" />
                      My Appointments
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => onNavigate('auth')} size="sm">
                Sign In
              </Button>
            )}

            {/* Hamburger Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-teal-600 transition-colors rounded-full hover:bg-teal-50"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
