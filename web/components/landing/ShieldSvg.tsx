interface ShieldSvgProps {
  className?: string;
  variant?: "full" | "mini";
  id?: string;
}

export default function ShieldSvg({ className, variant = "full", id = "shield" }: ShieldSvgProps) {
  const clipId = `${id}-clip`;
  const shadowId = `${id}-shadow`;

  if (variant === "mini") {
    return (
      <svg
        className={className}
        viewBox="0 0 100 118"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <path d="M50,6 L88,20 L88,68 Q88,100 50,113 Q12,100 12,68 L12,20 Z" />
          </clipPath>
        </defs>
        <rect x="12" y="6" width="38" height="107" clipPath={`url(#${clipId})`} fill="#8B3618" />
        <rect x="50" y="6" width="38" height="107" clipPath={`url(#${clipId})`} fill="#1A5C28" />
        <polygon
          points="28,113 56,6 68,6 40,113"
          clipPath={`url(#${clipId})`}
          fill="#C9A227"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 118"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M50,5 L89,20 L89,68 Q89,101 50,114 Q11,101 11,68 L11,20 Z" />
        </clipPath>
        <filter id={shadowId} x="-25%" y="-15%" width="160%" height="150%">
          <feDropShadow dx="4" dy="6" stdDeviation="6" floodColor="rgba(10,25,10,0.22)" />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        {/* Left half — terracotta */}
        <rect x="11" y="5" width="39" height="109" clipPath={`url(#${clipId})`} fill="#8B3618" />
        {/* Right half — forest green */}
        <rect x="50" y="5" width="39" height="109" clipPath={`url(#${clipId})`} fill="#1A5C28" />
        {/* Geometric pattern — terracotta side */}
        <g clipPath={`url(#${clipId})`} fill="#fff" opacity="0.2">
          <path d="M22,18l6,9-6,9-6-9z M22,40l6,9-6,9-6-9z M22,62l6,9-6,9-6-9z M22,84l6,9-6,9-6-9z" />
          <path d="M35,26l5,7.5-5,7.5-5-7.5z M35,48l5,7.5-5,7.5-5-7.5z M35,70l5,7.5-5,7.5-5-7.5z M35,92l5,7.5-5,7.5-5-7.5z" />
          <line x1="11" y1="34" x2="50" y2="34" stroke="#fff" strokeWidth="0.7" opacity="0.4" />
          <line x1="11" y1="56" x2="50" y2="56" stroke="#fff" strokeWidth="0.7" opacity="0.4" />
          <line x1="11" y1="78" x2="50" y2="78" stroke="#fff" strokeWidth="0.7" opacity="0.4" />
          <line x1="11" y1="100" x2="50" y2="100" stroke="#fff" strokeWidth="0.7" opacity="0.4" />
        </g>
        {/* Geometric pattern — green side */}
        <g clipPath={`url(#${clipId})`} fill="#fff" opacity="0.15">
          <path d="M65,18l6,9-6,9-6-9z M65,40l6,9-6,9-6-9z M65,62l6,9-6,9-6-9z M65,84l6,9-6,9-6-9z" />
          <path d="M78,26l5,7.5-5,7.5-5-7.5z M78,48l5,7.5-5,7.5-5-7.5z M78,70l5,7.5-5,7.5-5-7.5z" />
        </g>
        {/* Gold diagonal band */}
        <g clipPath={`url(#${clipId})`}>
          <polygon points="26,114 57,5 70,5 39,114" fill="#C9A227" />
          <polygon points="57,5 70,5 63,18" fill="#E0B830" />
        </g>
        {/* Shield outline */}
        <path
          d="M50,5 L89,20 L89,68 Q89,101 50,114 Q11,101 11,68 L11,20 Z"
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
