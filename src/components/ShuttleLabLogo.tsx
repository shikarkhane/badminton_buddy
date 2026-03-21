export default function ShuttleLabLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shuttlecock cork (bottom) */}
      <ellipse cx="32" cy="52" rx="6" ry="4" fill="currentColor" opacity="0.9" />

      {/* Shuttlecock feathers */}
      <path
        d="M32 48 C28 40, 16 28, 18 14 C18 8, 24 4, 32 4 C40 4, 46 8, 46 14 C48 28, 36 40, 32 48Z"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Feather lines */}
      <line x1="32" y1="8" x2="32" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="24" y1="12" x2="28" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="40" y1="12" x2="36" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.3" />

      {/* Speed lines */}
      <line x1="8" y1="20" x2="14" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="26" x2="13" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="8" y1="32" x2="14" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
