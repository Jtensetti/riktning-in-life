import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { Search, Plus, Minus, Check } from "lucide-react";

export type CatalogItem = {
  slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  default_minutes: number;
  tags_json: string[];
};

export type ActivityDraft = {
  slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  duration_minutes: number;
  mood_delta: number; // -2..+2
};

const colorBg = (color: string): string => {
  switch (color) {
    case "orange": return "bg-orange-start text-white";
    case "blue": return "bg-blue-calm text-white";
    case "yellow": return "bg-yellow-journal text-foreground";
    case "purple": return "bg-purple-sleep text-white";
    case "pink": return "bg-pink-move text-white";
    case "green": return "bg-green-recovery text-white";
    default: return "bg-cream-card text-foreground";
  }
};

const moodFaces: { value: number; label: string; emoji: string }[] = [
  { value: -2, label: "Sämre", emoji: "😔" },
  { value: -1, label: "Lite sämre", emoji: "🙁" },
  { value: 0, label: "Som vanligt", emoji: "😐" },
  { value: 1, label: "Lite bättre", emoji: "🙂" },
  { value: 2, label: "Mycket bättre", emoji: "😊" },
];

const durationPresets = [15, 30, 60, 90];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (draft: ActivityDraft) => void;
}

export const ActivityPicker = ({ open, onOpenChange, onAdd }: Props) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [duration, setDuration] = useState(30);
  const [mood, setMood] = useState(1);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    supabase
      .from("activity_catalog")
      .select("slug,label,category,icon,color,default_minutes,tags_json")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCatalog(data as any);
      });
  }, [open]);

  // Reset internal state when closed
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQ("");
      setActiveCat(null);
      setCustomLabel("");
      setMood(1);
    }
  }, [open]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    catalog.forEach((c) => {
      if (!seen.has(c.category)) { seen.add(c.category); out.push(c.category); }
    });
    return out;
  }, [catalog]);

  const filtered = useMemo(() => {
    return catalog.filter((c) => {
      if (activeCat && c.category !== activeCat) return false;
      if (q && !`${c.label} ${c.category} ${(c.tags_json || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [catalog, activeCat, q]);

  const pick = (item: CatalogItem) => {
    setSelected(item);
    setDuration(item.default_minutes);
    setMood(1);
  };

  const confirm = () => {
    if (!selected) return;
    onAdd({
      slug: selected.slug,
      label: selected.label,
      category: selected.category,
      icon: selected.icon,
      color: selected.color,
      duration_minutes: duration,
      mood_delta: mood,
    });
    onOpenChange(false);
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    onAdd({
      slug: `custom-${Date.now()}`,
      label,
      category: "Egen aktivitet",
      icon: "spark",
      color: "yellow",
      duration_minutes: 30,
      mood_delta: 1,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[28px] max-h-[88vh] bg-background border-border-soft">
        <DrawerHeader className="text-left px-6 pb-2">
          <DrawerTitle className="text-[22px] leading-tight font-extrabold">
            {selected ? "Hur kändes det?" : "Vad gjorde du?"}
          </DrawerTitle>
          <p className="text-sm text-text-secondary">
            {selected ? "Inget rätt eller fel — bara det du märkte." : "Välj något du faktiskt gjort idag. Litet räknas också."}
          </p>
        </DrawerHeader>

        {!selected && (
          <div className="px-6 pb-6 overflow-y-auto">
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-surface-alt">
                <Search size={16} className="text-text-secondary" strokeWidth={2.4} />
              </span>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sök t.ex. promenad, kaffe, barn"
                className="h-12 pl-14 pr-5 rounded-full border border-border-soft bg-surface text-base"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-3 mb-2">
              <button
                onClick={() => setActiveCat(null)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold press-soft border-2 ${
                  activeCat === null ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                }`}
              >
                Alla
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(activeCat === c ? null : c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold press-soft border-2 ${
                    activeCat === c ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-4">
              {filtered.map((item, i) => (
                <button
                  key={item.slug}
                  onClick={() => pick(item)}
                  className={`rounded-2xl p-3 text-left press-soft animate-fade-in-up shadow-card flex items-center gap-2.5 min-h-[70px] ${colorBg(item.color)}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
                >
                  <div className="shrink-0 w-10 h-10 rounded-full bg-white/25 grid place-items-center">
                    <AbstractIcon name={item.icon as IconName} size={22} color="currentColor" />
                  </div>
                  <span className="font-extrabold text-[13px] leading-tight">{item.label}</span>
                </button>
              ))}
              {filtered.length === 0 && q.trim() && (
                <div className="col-span-2 card-cream p-4">
                  <p className="text-sm font-extrabold mb-2">Inget i listan?</p>
                  <p className="text-xs text-text-secondary mb-3">Lägg till "{q}" som en egen aktivitet.</p>
                  <Button
                    onClick={() => { setCustomLabel(q); addCustom(); }}
                    className="w-full h-11 rounded-full bg-foreground text-background font-extrabold press-soft"
                  >
                    <Plus size={16} className="mr-1" /> Lägg till "{q}"
                  </Button>
                </div>
              )}
            </div>

            {!q.trim() && (
              <div className="card-cream p-4 mb-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Egen aktivitet</p>
                <div className="flex gap-2">
                  <Input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Skriv in din egen…"
                    className="h-11 rounded-full border border-border-soft bg-surface flex-1"
                  />
                  <Button
                    onClick={addCustom}
                    disabled={!customLabel.trim()}
                    className="h-11 rounded-full bg-foreground text-background font-extrabold px-4 press-soft"
                  >
                    Lägg till
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {selected && (
          <div className="px-6 pb-6 overflow-y-auto">
            <div className={`rounded-3xl p-4 mb-5 flex items-center gap-3 shadow-card ${colorBg(selected.color)}`}>
              <div className="shrink-0 w-12 h-12 rounded-full bg-white/25 grid place-items-center">
                <AbstractIcon name={selected.icon as IconName} size={28} color="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[17px] leading-tight">{selected.label}</h3>
                <p className="text-xs opacity-90">{selected.category}</p>
              </div>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Hur länge?</p>
            <div className="flex gap-2 mb-2 flex-wrap">
              {durationPresets.map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={`rounded-full px-4 py-2 text-sm font-extrabold border-2 press-soft ${
                    duration === m ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setDuration(Math.max(5, duration - 5))}
                className="w-10 h-10 rounded-full bg-surface border-2 border-border-soft grid place-items-center press-soft"
              >
                <Minus size={16} />
              </button>
              <span className="text-base font-extrabold flex-1 text-center">{duration} min</span>
              <button
                onClick={() => setDuration(Math.min(480, duration + 5))}
                className="w-10 h-10 rounded-full bg-surface border-2 border-border-soft grid place-items-center press-soft"
              >
                <Plus size={16} />
              </button>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Hur kändes det efteråt?</p>
            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {moodFaces.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setMood(f.value)}
                  className={`rounded-2xl p-2 flex flex-col items-center gap-1 border-2 press-soft ${
                    mood === f.value ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                  }`}
                >
                  <span className="text-2xl leading-none">{f.emoji}</span>
                  <span className="text-[9px] font-extrabold leading-tight text-center">{f.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setSelected(null)}
                variant="outline"
                className="flex-1 h-12 rounded-full border-2 border-border-soft font-extrabold press-soft"
              >
                Tillbaka
              </Button>
              <Button
                onClick={confirm}
                className="flex-1 h-12 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold press-soft"
              >
                <Check size={18} className="mr-1" /> Lägg till
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
