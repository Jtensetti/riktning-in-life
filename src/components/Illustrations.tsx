// Inline SVG illustrations for Riktning - flat, abstract, friendly

interface IllProps {
  className?: string;
}

export const SunBlob = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <circle cx="60" cy="60" r="38" fill="hsl(var(--orange-start))" />
    <path d="M60 38 a 22 22 0 0 1 22 22 H 38 a 22 22 0 0 1 22 -22 z" fill="hsl(var(--yellow-journal))" />
    <circle cx="50" cy="58" r="2.5" fill="hsl(var(--foreground))" />
    <circle cx="70" cy="58" r="2.5" fill="hsl(var(--foreground))" />
    <path d="M50 70 q10 6 20 0" stroke="hsl(var(--foreground))" strokeWidth="2.4" strokeLinecap="round" fill="none" />
  </svg>
);

export const BreathCircle = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <circle cx="60" cy="60" r="44" fill="hsl(var(--blue-calm) / 0.18)" className="animate-breathe origin-center" />
    <circle cx="60" cy="60" r="28" fill="hsl(var(--blue-calm))" />
    <path d="M30 86 q15 -10 30 0 t30 0" stroke="hsl(var(--blue-deep))" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

export const MoonBlob = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <circle cx="60" cy="60" r="40" fill="hsl(var(--purple-sleep))" />
    <path d="M70 40 a 24 24 0 1 0 0 40 a 18 18 0 1 1 0 -40 z" fill="hsl(var(--cream-card))" />
    <circle cx="32" cy="34" r="2" fill="hsl(var(--cream-card))" />
    <circle cx="92" cy="30" r="1.5" fill="hsl(var(--cream-card))" />
    <circle cx="100" cy="80" r="2" fill="hsl(var(--cream-card))" />
  </svg>
);

export const MoveBlob = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <circle cx="60" cy="60" r="42" fill="hsl(var(--pink-move) / 0.2)" />
    <circle cx="48" cy="50" r="14" fill="hsl(var(--pink-move))" />
    <rect x="42" y="60" width="12" height="32" rx="6" fill="hsl(var(--pink-move))" />
    <rect x="60" y="68" width="22" height="8" rx="4" fill="hsl(var(--green-recovery))" />
  </svg>
);

export const JournalBlob = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <rect x="22" y="26" width="68" height="80" rx="10" fill="hsl(var(--yellow-journal))" />
    <line x1="34" y1="46" x2="78" y2="46" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="34" y1="60" x2="72" y2="60" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="34" y1="74" x2="64" y2="74" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M86 16 l14 14 l-44 44 l-16 4 l4 -16 z" fill="hsl(var(--orange-start))" />
  </svg>
);

export const CareDoc = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <rect x="28" y="20" width="64" height="80" rx="8" fill="hsl(var(--blue-calm) / 0.18)" />
    <rect x="28" y="20" width="64" height="80" rx="8" fill="none" stroke="hsl(var(--blue-deep))" strokeWidth="2.4" />
    <line x1="40" y1="40" x2="80" y2="40" stroke="hsl(var(--blue-deep))" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="40" y1="54" x2="74" y2="54" stroke="hsl(var(--blue-deep))" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="40" y1="68" x2="80" y2="68" stroke="hsl(var(--blue-deep))" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="80" cy="84" r="8" fill="hsl(var(--green-recovery))" />
  </svg>
);

export const FocusBlob = ({ className = "" }: IllProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden>
    <circle cx="60" cy="60" r="40" fill="hsl(var(--green-recovery) / 0.2)" />
    <circle cx="60" cy="60" r="22" fill="hsl(var(--green-recovery))" />
    <circle cx="60" cy="60" r="6" fill="hsl(var(--cream-card))" />
  </svg>
);
