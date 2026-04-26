// Subtil haptisk feedback. Använder Web Vibration API där det finns
// (Android Chrome/Edge, vissa Samsung-browsers). iOS Safari saknar stöd —
// där blir det en no-op, vilket är önskat (vi vill aldrig krascha eller
// skrika åt användaren).
//
// Tre nivåer matchar designsystemets "press-soft / success / error" -toner:
//   tap     — 8 ms,  enstaka kort puls för knapptryck
//   success — [12, 60, 18], två mjuka pulser med kort paus
//   error   — [40, 30, 40], två tydligare pulser

type HapticPattern = "tap" | "success" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 8,
  success: [12, 60, 18],
  error: [40, 30, 40],
};

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/** Tryggt no-op-anrop på enheter utan stöd eller när användaren minskat motion. */
export const haptic = (pattern: HapticPattern = "tap"): void => {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  if (prefersReducedMotion()) return;
  try {
    navigator.vibrate?.(PATTERNS[pattern]);
  } catch {
    /* tysta — vissa browsers kastar för långa mönster */
  }
};
