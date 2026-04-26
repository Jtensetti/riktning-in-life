// Time context — pure helper, no dependencies.
// Used everywhere we adapt copy/recommendations to time of day, weekday, season.

export type PartOfDay = "morning" | "midday" | "afternoon" | "evening" | "night";
export type Season = "winter" | "spring" | "summer" | "autumn";

export type TimeContext = {
  partOfDay: PartOfDay;
  greeting: string;
  isWeekend: boolean;
  season: Season;
  hour: number;
  date: Date;
};

const partOfDayFromHour = (h: number): PartOfDay => {
  if (h >= 5 && h < 10) return "morning";
  if (h >= 10 && h < 14) return "midday";
  if (h >= 14 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
};

const greetingFor = (p: PartOfDay): string => {
  switch (p) {
    case "morning": return "God morgon";
    case "midday": return "Hej";
    case "afternoon": return "God eftermiddag";
    case "evening": return "God kväll";
    case "night": return "Sen kväll";
  }
};

const seasonFromMonth = (m: number): Season => {
  // m: 0–11. Svensk meteorologisk indelning (förenklat efter månad).
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  return "autumn";
};

export const getTimeContext = (now: Date = new Date()): TimeContext => {
  const hour = now.getHours();
  const partOfDay = partOfDayFromHour(hour);
  const day = now.getDay();
  return {
    partOfDay,
    greeting: greetingFor(partOfDay),
    isWeekend: day === 0 || day === 6,
    season: seasonFromMonth(now.getMonth()),
    hour,
    date: now,
  };
};
