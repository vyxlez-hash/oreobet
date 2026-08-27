export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };
  return (
    <div className={`font-display font-bold tracking-tight ${sizes[size]} ${className}`}>
      <span className="text-white">OREO</span>
      <span className="text-ink-200">BET</span>
    </div>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#B8B8C0" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#logoGrad)" />
        <rect x="1" y="1" width="38" height="38" rx="11" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
        <path d="M12 14C12 13 13 12 14 12H26C27 12 28 13 28 14V15.5C28 16.5 27 17.5 26 17.5H14C13 17.5 12 16.5 12 15.5V14Z" fill="#050505" />
        <path d="M12 20C12 19 13 18 14 18H26C27 18 28 19 28 20V21.5C28 22.5 27 23.5 26 23.5H14C13 23.5 12 22.5 12 21.5V20Z" fill="#050505" />
        <path d="M12 26C12 25 13 24 14 24H26C27 24 28 25 28 26V27.5C28 28.5 27 29.5 26 29.5H14C13 29.5 12 28.5 12 27.5V26Z" fill="#050505" />
        <circle cx="20" cy="20" r="2" fill="#FFFFFF" opacity="0.9" />
      </svg>
    </div>
  );
}
