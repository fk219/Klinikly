import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Stethoscope } from 'lucide-react';

const exploreLinks = [
  { name: 'Find a doctor', to: '/doctors' },
  { name: 'My appointments', to: '/dashboard' },
  { name: 'Patient sign in', to: '/auth' },
];

const specialtyLinks = [
  { name: 'Cardiology', to: '/doctors?specialty=Cardiology' },
  { name: 'Neurology', to: '/doctors?specialty=Neurology' },
  { name: 'Dermatology', to: '/doctors?specialty=Dermatology' },
  { name: 'Orthopedics', to: '/doctors?specialty=Orthopedics' },
  { name: 'All specialties', to: '/doctors' },
];

export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-7 w-7 text-teal-400" />
            <span className="text-xl font-bold">Klinikly</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-gray-300">
            A portfolio demo for multi-tenant hospital appointment booking. Hospitals, doctors, and appointments are seeded test data.
          </p>
          <p className="mt-4 text-xs text-gray-400">Not a real healthcare provider.</p>
          <a
            href="https://github.com/fk219/Klinikly"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-200"
          >
            View source on GitHub <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Explore</h3>
          <ul className="space-y-3">
            {exploreLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.to} className="text-sm text-gray-300 hover:text-teal-300">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Specialties</h3>
          <ul className="space-y-3">
            {specialtyLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.to} className="text-sm text-gray-300 hover:text-teal-300">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-gray-400">
          <span>© {currentYear} Klinikly. Portfolio demo.</span>
          <span>Built by Furqan.</span>
        </div>
      </div>
    </footer>
  );
};
