import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading = false,
  children, className = '', disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-mono uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-50';
  const variants = {
    primary: 'bg-pine text-canvas hover:bg-ink',
    secondary: 'bg-ink text-canvas hover:bg-pine',
    outline: 'border border-line bg-white text-ink hover:border-ink',
    ghost: 'text-muted hover:bg-stone hover:text-ink',
    danger: 'bg-coral text-canvas hover:bg-ink',
  };
  const sizes = {
    sm: 'min-h-8 px-2.5 py-1.5 text-[9px]',
    md: 'min-h-10 px-3.5 py-2 text-[10px]',
    lg: 'min-h-12 px-5 py-3 text-[11px]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
