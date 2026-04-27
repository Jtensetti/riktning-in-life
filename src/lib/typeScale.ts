/**
 * Type scale — single source of truth for text sizes used across Riktning.
 *
 * The Tailwind utility classes `text-h1`, `text-h2`, `text-card-title`,
 * `text-body`, `text-meta` are declared in `src/index.css` under
 * `@layer components` and map to these specs. Pages should use those
 * classes instead of ad-hoc `text-[NNpx]` arbitrary sizes.
 *
 * Spec (locked):
 *   H1          40 / 44 / 800
 *   H2          26 / 32 / 800
 *   CardTitle   22 / 28 / 800
 *   Body        16 / 24 / 600
 *   Meta        12 / 16 / 800 uppercase
 */
export type TypeScaleKey = "h1" | "h2" | "card-title" | "body" | "meta";

export interface TypeScaleEntry {
  /** Tailwind utility class declared in index.css. */
  className: string;
  /** font-size in px. */
  size: number;
  /** line-height in px. */
  line: number;
  /** font-weight. */
  weight: number;
  /** uppercase letterforms. */
  uppercase?: boolean;
}

export const TYPE_SCALE: Record<TypeScaleKey, TypeScaleEntry> = {
  h1: { className: "text-h1", size: 40, line: 44, weight: 800 },
  h2: { className: "text-h2", size: 26, line: 32, weight: 800 },
  "card-title": { className: "text-card-title", size: 22, line: 28, weight: 800 },
  body: { className: "text-body", size: 16, line: 24, weight: 600 },
  meta: { className: "text-meta", size: 12, line: 16, weight: 800, uppercase: true },
};
