import type { ReactNode } from 'react';
import { cn } from './utils';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-white text-black hover:bg-ink-50 font-semibold',
    secondary: 'glass text-white hover:bg-white/10 font-medium',
    outline: 'border border-ink-500 text-white hover:border-ink-200 hover:bg-white/5 font-medium',
    ghost: 'text-ink-100 hover:text-white hover:bg-white/5 font-medium',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out-expo active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'glass rounded-2xl',
        hover && 'transition-all duration-500 ease-out-expo hover:border-white/20 hover:bg-white/[0.06]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-white/10 bg-white/5 text-ink-100',
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {eyebrow && (
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-200">{eyebrow}</div>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">{title}</h2>
      {subtitle && <p className="text-ink-200 text-base md:text-lg max-w-2xl">{subtitle}</p>}
    </div>
  );
}
