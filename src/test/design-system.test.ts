/**
 * Design-system guards.
 *
 * These tests assert the architectural rules from plan.md so regressions
 * are caught at CI time instead of in design review:
 *
 *  1. `HeroBanner` is only allowed in `CrisisPlan.tsx`. Every other
 *     screen must use `ScreenHeader` from the ui-kit.
 *  2. Pages should not introduce ad-hoc text sizes via `text-[NNpx]`
 *     arbitrary Tailwind classes — they must use the typeScale utilities
 *     (`text-h1`, `text-h2`, `text-card-title`, `text-body`, `text-meta`).
 *     A small allowlist exists for legacy files we have not migrated yet;
 *     adding to that list requires a deliberate code review.
 *  3. The blocked tone phrases from `src/lib/tone.ts` must not appear in
 *     user-facing source files.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_PHRASES } from "@/lib/tone";

const PAGES_DIR = "src/pages";
const SRC_DIR = "src";

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
};

describe("design system guards", () => {
  it("only CrisisPlan may import HeroBanner", () => {
    const offenders: string[] = [];
    for (const file of walk(PAGES_DIR)) {
      if (file.endsWith("CrisisPlan.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (/from\s+["']@\/components\/HeroBanner["']/.test(src)) {
        offenders.push(file);
      }
    }
    expect(offenders, `HeroBanner used outside CrisisPlan in: ${offenders.join(", ")}`).toEqual([]);
  });

  it("pages do not use arbitrary text-[NNpx] sizes (use typeScale)", () => {
    // Legacy files we have not migrated yet — adding here requires review.
    const allowlist = new Set<string>([
      "src/pages/Today.tsx",
      "src/pages/Week.tsx",
      "src/pages/WeeklyReport.tsx",
      "src/pages/Checkin.tsx",
      "src/pages/Onboarding.tsx",
      "src/pages/Journal.tsx",
      "src/pages/Vard.tsx",
      "src/pages/Health.tsx",
      "src/pages/Settings.tsx",
      "src/pages/More.tsx",
      "src/pages/Explore.tsx",
      "src/pages/Exercises.tsx",
      "src/pages/ExerciseDetail.tsx",
      "src/pages/Sequences.tsx",
      "src/pages/SequenceDetail.tsx",
      "src/pages/QuickLog.tsx",
      "src/pages/Learn.tsx",
      "src/pages/LearnArticle.tsx",
      "src/pages/CrisisPlan.tsx",
      "src/pages/Auth.tsx",
    ]);
    const offenders: string[] = [];
    for (const file of walk(PAGES_DIR)) {
      if (allowlist.has(file)) continue;
      const src = readFileSync(file, "utf8");
      if (/text-\[\d+px\]/.test(src)) offenders.push(file);
    }
    expect(offenders, `Arbitrary text sizes in: ${offenders.join(", ")}`).toEqual([]);
  });

  it("blocked tone phrases do not appear in user-facing copy", () => {
    // Only scan string literals — identifiers like `StreakRing` or
    // `streaks.ts` are internal code, not Swedish user copy.
    const skip = new Set<string>([
      "src/lib/tone.ts",
      "src/test/design-system.test.ts",
    ]);
    const stringLiteral = /(["'`])((?:\\.|(?!\1).)*?)\1/g;
    const offenders: { file: string; phrase: string; snippet: string }[] = [];
    for (const file of walk(SRC_DIR)) {
      if (skip.has(file) || file.includes("/test/")) continue;
      const src = readFileSync(file, "utf8");
      for (const match of src.matchAll(stringLiteral)) {
        const literal = match[2].toLowerCase();
        // Skip imports/asset paths/CSS class names — not user copy.
        if (/^[./@\w-]+$/.test(literal)) continue;
        for (const phrase of BLOCKED_PHRASES) {
          if (literal.includes(phrase)) {
            offenders.push({ file, phrase, snippet: match[2].slice(0, 60) });
          }
        }
      }
    }
    expect(
      offenders,
      `Blocked phrases in user copy: ${offenders
        .map((o) => `"${o.snippet}" (${o.phrase}) in ${o.file}`)
        .join("; ")}`,
    ).toEqual([]);
  });
});
