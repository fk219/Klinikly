import React from 'react';
import {
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Heart,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Find a Doctor', href: '#' },
    { name: 'Book Appointment', href: '#' },
    { name: 'Emergency Care', href: '#' },
    { name: 'Patient Portal', href: '#' },
    { name: 'Health Records', href: '#' },
    { name: 'Insurance', href: '#' },
  ];

  const services = [
    { name: 'Cardiology', href: '#' },
    { name: 'Neurology', href: '#' },
    { name: 'Pediatrics', href: '#' },
    { name: 'Orthopedics', href: '#' },
    { name: 'Dermatology', href: '#' },
    { name: 'Psychiatry', href: '#' },
  ];

  const resources = [
    { name: 'Health Tips', href: '#' },
    { name: 'Medical News', href: '#' },
    { name: 'FAQ', href: '#' },
    { name: 'Support Center', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="relative">
                <Stethoscope className="h-8 w-8 text-teal-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                HealthCare+
              </span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Revolutionizing healthcare with AI-powered diagnostics,
              personalized treatment plans, and compassionate care. Your health
              journey starts here.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300 hover:text-teal-400 transition-colors">
                <Phone className="h-4 w-4 mr-3 text-teal-400" />
                <span className="text-sm">Emergency: (555) 911-HELP</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-teal-400 transition-colors">
                <Phone className="h-4 w-4 mr-3 text-teal-400" />
                <span className="text-sm">Appointments: (555) 123-CARE</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-teal-400 transition-colors">
                <Mail className="h-4 w-4 mr-3 text-teal-400" />
                <span className="text-sm">info@healthcareplus.com</span>
              </div>
              <div className="flex items-start text-gray-300 hover:text-teal-400 transition-colors">
                <MapPin className="h-4 w-4 mr-3 mt-0.5 text-teal-400 flex-shrink-0" />
                <span className="text-sm">
                  123 Medical Center Drive
                  <br />
                  Healthcare City, HC 12345
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-teal-400">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-teal-400 transition-colors text-sm hover:translate-x-1 transform duration-200 inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Medical Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-teal-400">
              Medical Services
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <a
                    href={service.href}
                    className="text-gray-300 hover:text-teal-400 transition-colors text-sm hover:translate-x-1 transform duration-200 inline-block"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-teal-400">
              Resources
            </h3>
            <ul className="space-y-3 mb-6">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <a
                    href={resource.href}
                    className="text-gray-300 hover:text-teal-400 transition-colors text-sm hover:translate-x-1 transform duration-200 inline-block"
                  >
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Hours */}
            <div className="bg-gradient-to-r from-teal-800/30 to-emerald-800/30 p-4 rounded-xl border border-teal-700/30">
              <div className="flex items-center mb-3">
                <Clock className="h-4 w-4 mr-2 text-teal-400" />
                <h4 className="font-medium text-sm text-teal-400">
                  Operating Hours
                </h4>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span>8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="pt-2 border-t border-teal-700/30">
                  <span className="text-red-400 font-medium flex items-center">
                    <Heart className="h-3 w-3 mr-1" />
                    Emergency: 24/7
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 mr-2">Follow us:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-teal-400 transition-colors transform hover:scale-110 duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-sm text-gray-400 flex justify-center items-center flex-col">
              <div className="mx-auto">
                {currentYear} © Klinikly. All rights reserved.
              </div>
              <div className="mx-auto">Licensed Healthcare Provider</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <span>Accredited by Joint Commission</span>
                <span>•</span>
                <span>HIPAA Compliant</span>
                <span>•</span>
                <span>Equal Opportunity Provider</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Made with</span>
                <Heart className="h-3 w-3 text-red-400 fill-current" />
                <span>by</span>
                <span className="font-semibold text-teal-400">Furqan</span>
              </div>
            </div>
            <div className="text-center mt-4 text-xs text-gray-500">
              For medical emergencies, call 911 immediately
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
