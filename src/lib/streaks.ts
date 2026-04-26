// Mjuka "kedjor": "X av senaste 7 dagar" — en ring som fylls, aldrig går sönder.
// Räknar tre separata vanor utifrån befintlig data: check-in, aktivitet, övning.

export type StreakKind = "checkin" | "activity" | "session";

export type StreakCounts = {
  checkin: number;   // antal unika datum med daily_checkin senaste 7 dagar
  activity: number;  // antal unika datum med activity_log senaste 7 dagar
  session: number;   // antal unika datum med exercise_session senaste 7 dagar
};

const isoDay = (d: Date | string): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
};

const last7Dates = (): Set<string> => {
  const out = new Set<string>();
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.add(isoDay(d));
  }
  return out;
};

/** Räknar unika dagar (max 7) i fönstret. Tar både `date` (YYYY-MM-DD) och `created_at` (ISO). */
export const countDaysInWindow = (rows: { date?: string | null; created_at?: string | null }[]): number => {
  const window = last7Dates();
  const seen = new Set<string>();
  for (const r of rows) {
    const day = r.date ?? (r.created_at ? isoDay(r.created_at) : null);
    if (!day) continue;
    if (window.has(day)) seen.add(day);
  }
  return seen.size;
};

/** Vilken kedja är "starkast" just nu — för att lyfta fram en på Today. */
export const strongestKind = (counts: StreakCounts): StreakKind => {
  const arr: [StreakKind, number][] = [
    ["checkin", counts.checkin],
    ["activity", counts.activity],
    ["session", counts.session],
  ];
  arr.sort((a, b) => b[1] - a[1]);
  return arr[0][0];
};

export const kindLabel = (k: StreakKind): string => {
  switch (k) {
    case "checkin": return "Check-in";
    case "activity": return "Aktivitet";
    case "session": return "Övning";
  }
};

/** Mjuk, icke-skuldbeläggande copy. Aldrig "du missade X dagar". */
export const streakCopy = (count: number, kind: StreakKind): { headline: string; sub: string } => {
  const what = kind === "checkin" ? "loggat dagen" : kind === "activity" ? "loggat något du gjort" : "gjort en övning";
  if (count === 0) return { headline: "Ny vecka, mjuk start", sub: `Börja med att ${what.replace("loggat ", "logga ").replace("gjort ", "göra ")} idag.` };
  if (count === 7) return { headline: "Hela veckan med", sub: `Du har ${what} alla 7 dagar. Det är fint.` };
  if (count >= 5) return { headline: `${count} av 7 dagar`, sub: "Det räcker. Riktningen finns där." };
  if (count >= 3) return { headline: `${count} av 7 dagar`, sub: "Bra grund. Fortsätt i din takt." };
  return { headline: `${count} av 7 dagar`, sub: "Litet räknas också. Kom tillbaka när du kan." };
};
