import { useEffect, useRef, type FC } from 'react';
import {
  Calendar,
  Users,
  Shield,
  Star,
  ArrowRight,
  Heart,
  Award,
  MapPin,
  Phone,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animations
    if (heroRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(
        '.hero-title',
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      )
        .fromTo(
          '.hero-subtitle',
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo(
          '.hero-buttons',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        );
    }

    // Stats counter animation
    if (statsRef.current) {
      gsap.fromTo(
        '.stat-number',
        { textContent: 0 },
        {
          textContent: (_index: number, target: Element) =>
            target.getAttribute('data-value') ?? '0',
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 80%',
          },
        }
      );
    }

    // Features animation
    if (featuresRef.current) {
      gsap.fromTo(
        '.feature-card',
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
          },
        }
      );
    }

    // Testimonials animation
    if (testimonialsRef.current) {
      gsap.fromTo(
        '.testimonial-card',
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: 'top 80%',
          },
        }
      );
    }
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Smart Booking',
      description:
        'AI-powered appointment scheduling with real-time availability',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Expert Network',
      description:
        'Access to 500+ certified specialists across 25+ medical fields',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description:
        'HIPAA-compliant with end-to-end encryption for your privacy',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Heart,
      title: 'Personalized Care',
      description: 'Tailored treatment plans based on your health history',
      color: 'from-red-500 to-rose-500',
    },
  ];

  const stats = [
    { number: '500', label: 'Expert Doctors', suffix: '+' },
    { number: '50000', label: 'Happy Patients', suffix: '+' },
    { number: '25', label: 'Specialties', suffix: '+' },
    { number: '99', label: 'Success Rate', suffix: '%' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      text: 'The booking process is incredibly smooth and the doctors are world-class. This platform has revolutionized my healthcare experience!',
      rating: 5,
      avatar:
        'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Patient',
      text: 'Finally, a healthcare platform that actually works seamlessly. The telemedicine features are outstanding.',
      rating: 5,
      avatar:
        'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    },
    {
      name: 'Emma Davis',
      role: 'Patient',
      text: 'The personalized care and attention to detail is remarkable. Highly recommend to anyone seeking quality healthcare.',
      rating: 5,
      avatar:
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-300/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="hero-title text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Your Health,
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Our Innovation
              </span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl text-teal-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Experience the future of healthcare seamless appointment booking,
              and personalized treatment plans.
            </p>
            <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => onNavigate('doctors')}
                    className="bg-white text-teal-600 hover:bg-gray-50 shadow-2xl"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Find a Doctor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => onNavigate('dashboard')}
                    className="border-white text-white hover:bg-white hover:text-teal-600 shadow-2xl"
                  >
                    My Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => onNavigate('auth')}
                    className="bg-white text-teal-600 hover:bg-gray-50 shadow-2xl"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => onNavigate('doctors')}
                    className="border-white text-white hover:bg-white hover:text-teal-600 shadow-2xl"
                  >
                    Browse Doctors
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div
        ref={statsRef}
        className="bg-gradient-to-r from-gray-50 to-teal-50 py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  <span className="stat-number" data-value={stat.number}>
                    0
                  </span>
                  <span>{stat.suffix}</span>
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose HealthCare+?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing healthcare with cutting-edge technology and
              compassionate care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card group p-8 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-teal-200"
              >
                <div
                  className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              24/7 Emergency Care Available
            </h2>
            <p className="text-xl text-red-100 mb-6">
              Our emergency team is always ready to help you in critical
              situations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-gray-50"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call Emergency: 911
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-red-600"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Find Nearest Hospital
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div
        ref={testimonialsRef}
        className="py-24 bg-gradient-to-br from-teal-50 to-emerald-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Patients Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people who trust us with their health.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl text-teal-100 mb-8">
              Join thousands of patients who have already discovered the future
              of healthcare.
            </p>

            {!user && (
              <Button
                size="lg"
                onClick={() => onNavigate('auth')}
                className="bg-white text-teal-600 hover:bg-gray-50 shadow-2xl"
              >
                <Award className="mr-2 h-5 w-5" />
                Start Your Journey Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
