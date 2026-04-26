// Kontinuitet mellan besök: kommer ihåg när användaren senast var i appen.
// Helt klient-sidigt, lagrat i localStorage. Ingen tracking utåt.

const KEY = "riktning_last_seen_at";

export type LastSeenBucket =
  | "first-visit"   // ingen tidigare visit registrerad
  | "fresh"         // < 2 timmar sedan
  | "same-day"      // samma dag, men > 2h
  | "yesterday"     // exakt igår
  | "few-days"      // 2–6 dagar sedan
  | "long-pause";   // ≥ 7 dagar sedan

export type LastSeen = {
  /** ISO timestamp för förra besöket (innan vi skrev över). null om första besöket. */
  previousAt: string | null;
  bucket: LastSeenBucket;
  /** Hela dagar sedan förra besöket. null om första besöket. */
  daysSince: number | null;
};

const startOfDay = (d: Date): number => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const bucketFor = (prev: Date, now: Date): { bucket: LastSeenBucket; daysSince: number } => {
  const diffH = (now.getTime() - prev.getTime()) / 3_600_000;
  const dayDiff = Math.round((startOfDay(now) - startOfDay(prev)) / 86_400_000);
  if (diffH < 2) return { bucket: "fresh", daysSince: dayDiff };
  if (dayDiff === 0) return { bucket: "same-day", daysSince: 0 };
  if (dayDiff === 1) return { bucket: "yesterday", daysSince: 1 };
  if (dayDiff < 7) return { bucket: "few-days", daysSince: dayDiff };
  return { bucket: "long-pause", daysSince: dayDiff };
};

/**
 * Läs förra "last seen" och skriv samtidigt över med nuvarande timestamp.
 * Returnerar info om förra besöket — anropas vid mount av Today.
 */
export const readAndUpdateLastSeen = (now: Date = new Date()): LastSeen => {
  let previousAt: string | null = null;
  try {
    previousAt = localStorage.getItem(KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(KEY, now.toISOString());
  } catch {
    /* ignore quota */
  }
  if (!previousAt) {
    return { previousAt: null, bucket: "first-visit", daysSince: null };
  }
  const prev = new Date(previousAt);
  if (isNaN(prev.getTime())) {
    return { previousAt: null, bucket: "first-visit", daysSince: null };
  }
  const { bucket, daysSince } = bucketFor(prev, now);
  return { previousAt, bucket, daysSince };
};

/** Hälsning som tar hänsyn till hur länge sedan användaren var här. */
export const greetingFor = (
  baseGreeting: string,
  lastSeen: LastSeen,
): { headline: string; sub?: string } => {
  switch (lastSeen.bucket) {
    case "first-visit":
      return { headline: baseGreeting };
    case "fresh":
      return { headline: baseGreeting };
    case "same-day":
      return { headline: "Välkommen tillbaka", sub: "Vi tar vid där vi släppte." };
    case "yesterday":
      return { headline: "Välkommen tillbaka", sub: "Skönt att se dig idag igen." };
    case "few-days":
      return {
        headline: "Skönt att se dig",
        sub: `Vi väntade. ${lastSeen.daysSince} dagar är ingen brist — bara en paus.`,
      };
    case "long-pause":
      return {
        headline: "Välkommen tillbaka",
        sub: "Vi börjar mjukt. En check-in idag räcker långt.",
      };
  }
};
