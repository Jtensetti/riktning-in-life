/**
 * pickerRecommend — enkel "Rekommenderat just nu"-funktion för ActivityPicker.
 *
 * Inte en medicinsk rekommendation, bara en mjuk genväg som tar tid på dygnet
 * + senaste aktiviteter och föreslår 4–6 aktiviteter som typiskt passar.
 *
 * Heuristik (avsiktligt försiktig):
 *   - morgon (05–10): rörelse / dagsljus / kaffe / planera
 *   - dag (10–17):    rörelse / socialt / fokus / mat
 *   - kväll (17–22):  återhämtning / kvällslandning / läsning
 *   - natt (22–05):   sömn / kroppsskanning / vila
 *
 * Vi använder `semantic_kind` om det finns, annars trycker vi på taggar/slugs.
 * Aktiviteter som redan loggats senaste timmarna får mindre vikt så listan
 * inte blir samma sak om och om igen.
 */
import type { CatalogItem } from "@/components/ActivityPicker";

type Bucket = "morning" | "day" | "evening" | "night";

const bucketForHour = (h: number): Bucket => {
  if (h < 5) return "night";
  if (h < 10) return "morning";
  if (h < 17) return "day";
  if (h < 22) return "evening";
  return "night";
};

/**
 * Vilka semantic_kinds som typiskt passar i varje tidsfönster.
 * Lägre index = högre prioritet.
 */
const BUCKET_KINDS: Record<Bucket, string[]> = {
  morning: ["rorelse", "vardag", "socialt", "fokus"],
  day: ["rorelse", "socialt", "fokus", "vardag"],
  evening: ["aterhamtning", "journal", "socialt"],
  night: ["somn", "aterhamtning"],
};

/** Slug-keywords som triggas i varje fönster (när semantic_kind saknas). */
const BUCKET_KEYWORDS: Record<Bucket, string[]> = {
  morning: ["morgon", "kaffe", "dagsljus", "promenad", "planera"],
  day: ["promenad", "lunch", "jobb", "rorelse", "mat", "vatten"],
  evening: ["kvall", "land", "tre-rader", "bok", "te", "vila"],
  night: ["somn", "andning", "kroppsskanning", "lagg"],
};

export type PickerRecommendInput = {
  catalog: CatalogItem[];
  /** Slugs för aktiviteter loggade senaste ~6h, så vi inte upprepar oss. */
  recentSlugs: string[];
  /** Override för enhetstestning. */
  now?: Date;
  /** Hur många kort som ska returneras (default 6). */
  limit?: number;
};

export const recommendForNow = ({
  catalog,
  recentSlugs,
  now = new Date(),
  limit = 6,
}: PickerRecommendInput): CatalogItem[] => {
  if (!catalog.length) return [];
  const bucket = bucketForHour(now.getHours());
  const kinds = BUCKET_KINDS[bucket];
  const keywords = BUCKET_KEYWORDS[bucket];
  const recent = new Set(recentSlugs);

  const scored = catalog.map((c) => {
    let score = 0;
    if (c.semantic_kind && kinds.includes(c.semantic_kind)) {
      score += 10 - kinds.indexOf(c.semantic_kind); // 10,9,8,7…
    }
    const haystack = `${c.slug} ${c.label} ${(c.tags_json ?? []).join(" ")}`.toLowerCase();
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 3;
    }
    if (recent.has(c.slug)) score -= 6; // tonas ner kraftigt, men inte borta
    return { c, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.c);
};
