import type { FC, ReactNode } from 'react';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const styles: Record<BadgeVariant, string> = {
  green: 'border-pine/30 bg-sage text-pine',
  red: 'border-coral/30 bg-[#F7ECE6] text-coral',
  yellow: 'border-[#C9A961]/40 bg-[#F5EEDC] text-[#7A5E1D]',
  blue: 'border-line bg-canvas text-muted',
  gray: 'border-line bg-stone text-muted',
};

export const Badge: FC<BadgeProps> = ({ variant = 'gray', children }) => (
  <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${styles[variant]}`}>
    {children}
  </span>
);
