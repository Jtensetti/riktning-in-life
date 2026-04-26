// Riktning abstract icon set — flat, geometric, friendly. Inline SVGs in the same
// style as the existing illustrations. Use `color` prop to override fill (defaults
// to currentColor so they inherit text color).

import type { SVGProps } from "react";

export type IconName =
  | "house-soft"
  | "spark"
  | "pie"
  | "pencil-soft"
  | "heart-pulse"
  | "blob-smile"
  | "moon-soft"
  | "play-soft"
  | "flag"
  | "eye-closed"
  | "bike"
  | "bookmark-soft";

interface Props extends Omit<SVGProps<SVGSVGElement>, "color"> {
  name: IconName;
  size?: number;
  color?: string;
  /** Secondary accent color (used for two-tone icons like blob-smile, pie). Defaults to a softer tint. */
  accent?: string;
}

export const AbstractIcon = ({ name, size = 28, color = "currentColor", accent, ...rest }: Props) => {
  const a = accent ?? "hsl(var(--yellow-journal))";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    ...rest,
  };

  switch (name) {
    case "house-soft":
      return (
        <svg {...common}>
          <path
            d="M5 14.5 L16 5 L27 14.5 V25 a3 3 0 0 1 -3 3 H8 a3 3 0 0 1 -3 -3 Z"
            fill={color}
          />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path
            d="M16 3 L18.5 12 L27 14 L18.5 16.5 L16 26 L13.5 16.5 L5 14 L13.5 12 Z"
            fill={color}
          />
          <circle cx="26" cy="6" r="1.6" fill={color} opacity="0.6" />
        </svg>
      );

    case "pie":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" fill={a} opacity="0.45" />
          <path d="M16 4 a12 12 0 0 1 12 12 H16 Z" fill={color} />
        </svg>
      );

    case "pencil-soft":
      return (
        <svg {...common}>
          <path
            d="M21 4.5 l6.5 6.5 -15 15 H6 v-6.5 z"
            fill={color}
          />
          <path d="M19.5 6 l6.5 6.5" stroke={a} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case "heart-pulse":
      return (
        <svg {...common}>
          <path
            d="M16 27 C8 21 3 16 3 11 a6 6 0 0 1 11 -3 a6 6 0 0 1 11 3 c0 5 -5 10 -13 16 z"
            fill={color}
          />
          <path d="M8 14 h3 l2 -3 l3 6 l2 -3 h6" stroke="hsl(var(--surface))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "blob-smile":
      return (
        <svg {...common}>
          <path
            d="M16 3 C24 3 29 9 29 16 C29 23 24 29 16 29 C8 29 3 23 3 16 C3 9 8 3 16 3 Z"
            fill={color}
          />
          <path d="M11 17 q3 4 6 0" stroke="hsl(var(--foreground))" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M18 17 q3 4 6 0" stroke="hsl(var(--foreground))" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
        </svg>
      );

    case "moon-soft":
      return (
        <svg {...common}>
          <path
            d="M22 4 a13 13 0 1 0 6 14 a10 10 0 0 1 -6 -14 z"
            fill={color}
          />
          <circle cx="6" cy="8" r="0.9" fill={color} opacity="0.5" />
          <circle cx="27" cy="26" r="1.1" fill={color} opacity="0.5" />
        </svg>
      );

    case "play-soft":
      return (
        <svg {...common}>
          <path d="M9 6 L26 16 L9 26 Z" fill={color} />
        </svg>
      );

    case "flag":
      return (
        <svg {...common}>
          <path d="M8 4 v24" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9 5 q9 -1 14 3 q-7 4 -14 3 z" fill={color} />
        </svg>
      );

    case "eye-closed":
      return (
        <svg {...common}>
          <path
            d="M3 14 q13 12 26 0"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M9 21 l-2 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 22 v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M23 21 l2 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "bike":
      return (
        <svg {...common}>
          <circle cx="8" cy="22" r="5" fill="none" stroke={color} strokeWidth="2.2" />
          <circle cx="24" cy="22" r="5" fill="none" stroke={color} strokeWidth="2.2" />
          <path d="M8 22 L15 12 L21 22 M15 12 L19 12 M22 22 L19 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "bookmark-soft":
      return (
        <svg {...common}>
          <path d="M8 4 h16 a2 2 0 0 1 2 2 v22 l-10 -6 l-10 6 V6 a2 2 0 0 1 2 -2 z" fill={color} />
        </svg>
      );

    default:
      return null;
  }
};
