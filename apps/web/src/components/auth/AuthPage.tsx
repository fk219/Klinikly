import { useState, useEffect, useRef, type FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Stethoscope, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/authStore';
import { Button } from '../common/Button';
import { gsap } from 'gsap';

export const AuthPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const { login, register, loading } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (formRef.current) {
      gsap.fromTo(formRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
    }
    if (logoRef.current) {
      gsap.fromTo(logoRef.current, { scale: 0.94 }, { scale: 1, duration: 0.35, ease: 'power2.out' });
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else {
        toast.error('Invalid email or password');
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      const success = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password
      });
      if (success) {
        toast.success('Account created successfully!');
        navigate(from, { replace: true });
      } else {
        toast.error('Registration failed. Please check your details and try again.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div ref={formRef} className="w-full max-w-md space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div ref={logoRef} className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back!' : 'Join Klinikly'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-teal-600 hover:text-teal-500 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange}
                      className="appearance-none relative block w-full px-4 py-3 pl-12 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all"
                      placeholder="Enter your full name" />
                    <User className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                      className="appearance-none relative block w-full px-4 py-3 pl-12 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all"
                      placeholder="Enter your phone number (optional)" />
                    <Phone className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange}
                  className="appearance-none relative block w-full px-4 py-3 pl-12 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all"
                  placeholder="Enter your email address" />
                <Mail className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'} required value={formData.password} onChange={handleInputChange}
                  className="appearance-none relative block w-full px-4 py-3 pl-12 pr-12 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all"
                  placeholder="Enter your password" />
                <Lock className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-teal-600 transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password" required value={formData.confirmPassword} onChange={handleInputChange}
                    className="appearance-none relative block w-full px-4 py-3 pl-12 pr-12 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white transition-all"
                    placeholder="Confirm your password" />
                  <Lock className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-teal-600 transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
