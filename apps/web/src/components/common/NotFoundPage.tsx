import type { FC } from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: FC = () => (
  <div className="bg-canvas">
    <div className="container-editorial flex min-h-[65vh] items-center py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">404 / Page not found</p>
        <h1 className="mt-4 font-serif text-[clamp(3rem,7vw,6.5rem)] leading-[0.88] tracking-[-0.045em] text-ink">
          This time <span className="italic text-coral">doesn’t exist.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
          The page may have moved, or the address may be incomplete. The directory and the calendar are
          both still open.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/doctors" className="btn btn-primary">
            Find a doctor
          </Link>
          <Link to="/" className="btn btn-outline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  </div>
);
