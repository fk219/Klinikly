import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

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
    <footer className="border-t border-line bg-ink text-canvas">
      <div className="container-editorial grid gap-12 py-16 md:grid-cols-[1.7fr_1fr_1fr] lg:py-20">
        <div>
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Klinikly home">
            <span className="flex h-10 w-10 items-center justify-center bg-canvas font-serif text-xl text-ink">K</span>
            <span className="font-serif text-2xl tracking-tight">Klinikly</span>
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-canvas/60">
            Multi-tenant hospital appointment booking. Each hospital manages its own doctors and schedules;
            patients claim real slots.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas/40">
            Portfolio demo · Seeded data · Not a real provider
          </p>
          <a
            href="https://github.com/fk219/Klinikly"
            target="_blank"
            rel="noreferrer"
            className="link-line mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas/70 transition-colors hover:text-canvas"
          >
            Source on GitHub <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <nav aria-label="Footer explore">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-canvas/40">Explore</h2>
          <ul className="mt-5 space-y-3">
            {exploreLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.to}
                  className="text-sm text-canvas/70 transition-colors hover:text-canvas"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer specialties">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-canvas/40">Specialties</h2>
          <ul className="mt-5 space-y-3">
            {specialtyLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.to}
                  className="text-sm text-canvas/70 transition-colors hover:text-canvas"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-canvas/10">
        <div className="container-editorial flex flex-col justify-between gap-3 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas/40 sm:flex-row">
          <span>© {currentYear} Klinikly</span>
          <span>Built by Furqan</span>
        </div>
      </div>
    </footer>
  );
};
