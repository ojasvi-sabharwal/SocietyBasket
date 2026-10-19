// SocietyBasket logo mark — fresh & clean light theme.
// Basket formed by arcs cradling three circles (community goods) on a lime plate.

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  tone?: 'default' | 'light';
}

export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill="#D9F66F" />
      <circle cx="24" cy="24" r="22" fill="url(#freshSheen)" fillOpacity="0.5" />
      <circle cx="17.5" cy="18.5" r="3.4" fill="#007A1F" />
      <circle cx="24" cy="16.5" r="3.8" fill="#203D24" />
      <circle cx="30.5" cy="18.5" r="3.4" fill="#007A1F" />
      <path
        d="M11 24.5h26l-3.2 11.2a3 3 0 0 1-2.9 2.3H17.1a3 3 0 0 1-2.9-2.3L11 24.5Z"
        fill="#203D24"
      />
      <path
        d="M16.5 27.5h15M17.5 31h13"
        stroke="#D9F66F"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <defs>
        <linearGradient id="freshSheen" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="1" stopColor="#EAF4D8" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  size = 36,
  withWordmark = true,
  className = '',
  tone = 'default',
}: LogoProps) {
  const wordmarkColor = tone === 'light' ? 'text-white' : 'text-neon-ink';
  const accentColor = 'text-neon-green';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className={`font-display text-[19px] font-semibold tracking-tight leading-none ${wordmarkColor}`}
        >
          Society<span className={accentColor}>Basket</span>
        </span>
      )}
    </span>
  );
}
