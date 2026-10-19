import { type ReactNode } from 'react';

export function Badge({
  children,
  tone = 'green',
}: {
  children: ReactNode;
  tone?: 'spring' | 'green' | 'red' | 'emerald' | 'muted' | 'outline';
}) {
  const tones: Record<string, string> = {
    spring: 'bg-neon-spring/30 text-neon-green ring-neon-spring/50',
    green: 'bg-neon-spring/20 text-neon-green ring-neon-spring/40',
    red: 'bg-red-50 text-red-600 ring-red-200',
    emerald: 'bg-green-50 text-neon-green ring-green-200',
    muted: 'bg-neon-soft text-neon-ash ring-neon-dark',
    outline: 'bg-white text-neon-ink ring-neon-dark',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset transition-all ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function DiscountBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[#203D24] px-2.5 py-1 text-[11px] font-bold leading-none text-white ring-1 ring-black/10 shadow-[0_1px_3px_rgba(0,0,0,0.25)] z-10"
    >
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-neon-panel ring-1 ring-neon-dark shadow-card transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'terracotta' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-neon-green text-white hover:bg-neon-greenDim active:bg-neon-green shadow-soft font-bold',
    terracotta:
      'bg-neon-spring text-neon-ink hover:bg-neon-springDim active:bg-neon-spring shadow-soft font-bold',
    soft:
      'bg-neon-soft text-neon-green hover:bg-neon-spring/40 ring-1 ring-inset ring-neon-spring/50 font-semibold',
    outline:
      'bg-white text-neon-ink ring-1 ring-inset ring-neon-dark hover:bg-neon-soft hover:ring-neon-spring/60 font-semibold',
    ghost: 'bg-transparent text-neon-ash hover:bg-neon-soft hover:text-neon-ink font-semibold',
  };
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-xl',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`mb-6 ${align === 'center' ? 'text-center' : ''}`}>
      {eyebrow && (
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-2 font-display text-[28px] leading-tight font-semibold tracking-tight text-neon-ink">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2 text-sm text-neon-ash ${align === 'center' ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
