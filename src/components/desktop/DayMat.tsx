/**
 * DayMat — kompakt grid över dagens aktivitetsbrickor.
 *
 * Ersätter "Senaste aktivitet"-listan på desktop när vi vill att
 * användaren ska *överblicka* dagen, inte läsa rad för rad. Varje
 * aktivitet visas som en liten färgad bricka:
 *   färg = kategori, ikon = typ, hover = namn + effekt.
 *
 * Ovanför brickorna: en mjuk sammanfattning ("3 aktiviteter · mest
 * återhämtning"). Tom dag visar en mjuk uppmaning, inte ett tomt kort.
 *
 * Komponenten bär *ingen egen datahämtning* — Today/Snabblogg
 * skickar in dagens activity_logs så vi inte triggar dubbla frågor.
 */
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import type { TodayActivity } from "@/hooks/useTodayActivities";

type Props = {
  activities: TodayActivity[];
  onAdd?: () => void;
  /** Visas som rubrik. Default "Dagens aktiviteter". */
  title?: string;
};

const colorVar = (color: string): string => {
  switch (color) {
    case "orange": return "hsl(var(--orange-start))";
    case "blue": return "hsl(var(--blue-calm))";
    case "yellow": return "hsl(var(--yellow-journal))";
    case "purple": return "hsl(var(--purple-sleep))";
    case "pink": return "hsl(var(--pink-move))";
    case "green": return "hsl(var(--green-recovery))";
    default: return "hsl(var(--orange-start))";
  }
};

const isLightChip = (color: string) => color === "yellow";

/** Mjuk sammanfattning av dagen — "3 aktiviteter · mest återhämtning". */
const summarize = (acts: TodayActivity[]): string => {
  if (acts.length === 0) return "";
  const counts: Record<string, number> = {};
  for (const a of acts) {
    const k = a.semantic_kind ?? a.category ?? "annat";
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const labels: Record<string, string> = {
    rorelse: "rörelse",
    aterhamtning: "återhämtning",
    socialt: "socialt",
    fokus: "fokus",
    vardag: "vardag",
    somn: "sömn",
    journal: "reflektion",
  };
  const topLabel = top ? labels[top[0]] ?? top[0].toLowerCase() : null;
  const word = acts.length === 1 ? "aktivitet" : "aktiviteter";
  return topLabel ? `${acts.length} ${word} · mest ${topLabel}` : `${acts.length} ${word}`;
};

export const DayMat = ({ activities, onAdd, title = "Dagens aktiviteter" }: Props) => {
  const navigate = useNavigate();

  if (activities.length === 0) {
    return (
      <section className="rounded-3xl bg-surface border border-border-soft p-5">
        <h3 className="text-[15px] font-extrabold mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-4">
          Dagen behöver inte vara färdig för att räknas. Lägg till en liten sak.
        </p>
        <button
          onClick={onAdd ?? (() => navigate("/snabblogg"))}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-orange-start text-white font-extrabold text-sm press-soft"
        >
          <Plus size={16} strokeWidth={2.6} />
          Logga en aktivitet
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-surface border border-border-soft p-5">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h3 className="text-[15px] font-extrabold">{title}</h3>
        <span className="text-[12px] font-bold text-text-secondary truncate">
          {summarize(activities)}
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
        {activities.map((a) => {
          const bg = colorVar(a.color);
          const light = isLightChip(a.color);
          const effects: string[] = [];
          if (a.mood_delta != null && a.mood_delta !== 0) {
            effects.push(`Mående ${a.mood_delta > 0 ? "+" : ""}${a.mood_delta}`);
          }
          if (a.duration_minutes) effects.push(`${a.duration_minutes} min`);
          const tip = [a.label, effects.join(" · ")].filter(Boolean).join("\n");
          return (
            <div
              key={a.id}
              title={tip}
              aria-label={tip}
              className="aspect-square rounded-2xl grid place-items-center press-soft cursor-default relative"
              style={{
                background: bg,
                boxShadow: "0 1px 2px hsl(var(--foreground) / 0.06)",
              }}
            >
              <AbstractIcon
                name={(a.icon as IconName) || "blob-smile"}
                size={28}
                inline
              />
              <span className="sr-only">
                {a.label}
                {effects.length > 0 ? ` — ${effects.join(", ")}` : ""}
              </span>
              {/* osynlig under-text för light chips */}
              {light && <span className="sr-only" />}
            </div>
          );
        })}
        {/* Add-bricka i samma grid så det känns som ett bibliotek */}
        <button
          onClick={onAdd ?? (() => navigate("/snabblogg"))}
          aria-label="Lägg till aktivitet"
          title="Lägg till aktivitet"
          className="aspect-square rounded-2xl grid place-items-center bg-surface-alt hover:bg-surface-alt/80 border border-dashed border-border-soft text-text-secondary press-soft transition-colors"
        >
          <Plus size={20} strokeWidth={2.4} />
        </button>
      </div>
    </section>
  );
};
