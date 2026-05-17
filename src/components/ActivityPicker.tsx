import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { ActivityTile } from "./desktop/ActivityTile";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { recommendForNow } from "@/lib/pickerRecommend";
import { Search, Plus, Minus, Check, Star, Layers } from "lucide-react";

export type CatalogItem = {
  slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  default_minutes: number;
  tags_json: string[];
  semantic_kind: SemanticKind | null;
};

export type SemanticKind =
  | "rorelse"
  | "aterhamtning"
  | "socialt"
  | "fokus"
  | "vardag"
  | "somn"
  | "journal";

export type Intensity = "latt" | "medel" | "hard";
export type WithWho = "ensam" | "partner" | "barn" | "van" | "kollega" | "annan";
export type SleepQuality = "dalig" | "okej" | "bra";
export type Location = "inne" | "ute";

export type ActivityDraft = {
  slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  duration_minutes: number;
  mood_delta: number; // -2..+2
  semantic_kind?: SemanticKind | null;
  intensity?: Intensity | null;
  with_who?: WithWho | null;
  sleep_quality?: SleepQuality | null;
  location?: Location | null;
};

// Färger används nu via ActivityTile + ikon-bakgrund i detaljvyn — den
// tidigare colorBg-helpern är borta tillsammans med inline-PickerCard.

const moodFaces: { value: number; label: string }[] = [
  { value: -2, label: "Sämre" },
  { value: -1, label: "Lite sämre" },
  { value: 0, label: "Som vanligt" },
  { value: 1, label: "Lite bättre" },
  { value: 2, label: "Mycket bättre" },
];

const durationPresets = [15, 30, 60, 90];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (draft: ActivityDraft) => void;
}

export const ActivityPicker = ({ open, onOpenChange, onAdd }: Props) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [duration, setDuration] = useState(30);
  const [mood, setMood] = useState(1);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [withWho, setWithWho] = useState<WithWho | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  // Multi-select: när på, läggs valda i en Set och vi visar en sticky bar
  // med "Spara N aktiviteter". Detaljformuläret hoppas över helt — varje
  // aktivitet sparas med default-tid och mood_delta = 0.
  const [multi, setMulti] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const recentSlugs = useRecentActivities(6);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("activity_catalog")
      .select("slug,label,category,icon,color,default_minutes,tags_json,semantic_kind")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCatalog(data as any);
      });
    supabase
      .from("activity_favorites")
      .select("activity_slug")
      .then(({ data }) => {
        if (data) setFavorites(new Set(data.map((d: any) => d.activity_slug)));
      });
  }, [open]);

  const toggleFavorite = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const next = new Set(favorites);
    if (favorites.has(slug)) {
      next.delete(slug);
      setFavorites(next);
      await supabase.from("activity_favorites").delete().eq("user_id", uid).eq("activity_slug", slug);
    } else {
      next.add(slug);
      setFavorites(next);
      await supabase.from("activity_favorites").insert({ user_id: uid, activity_slug: slug });
    }
  };

  // Reset internal state when closed
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setQ("");
      setActiveCat(null);
      setCustomLabel("");
      setMood(1);
      setIntensity(null);
      setWithWho(null);
      setSleepQuality(null);
      setLocation(null);
      setMulti(false);
      setPicked(new Set());
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
      if (activeCat && activeCat !== "__fav__" && c.category !== activeCat) return false;
      if (activeCat === "__fav__" && !favorites.has(c.slug)) return false;
      if (q && !`${c.label} ${c.category} ${(c.tags_json || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [catalog, activeCat, q, favorites]);

  const favoriteItems = useMemo(
    () => catalog.filter((c) => favorites.has(c.slug)),
    [catalog, favorites]
  );

  const recentItems = useMemo(() => {
    if (!recentSlugs.length) return [] as CatalogItem[];
    const bySlug = new Map(catalog.map((c) => [c.slug, c]));
    return recentSlugs.map((s) => bySlug.get(s)).filter((c): c is CatalogItem => !!c);
  }, [catalog, recentSlugs]);

  /** "Rekommenderat just nu" — tid-på-dygnet + senaste loggar. */
  const recommendedItems = useMemo(() => {
    return recommendForNow({ catalog, recentSlugs, limit: 6 }).filter(
      (c) => !recentSlugs.includes(c.slug),
    );
  }, [catalog, recentSlugs]);

  const draftFromItem = (item: CatalogItem, opts?: { mood?: number }): ActivityDraft => ({
    slug: item.slug,
    label: item.label,
    category: item.category,
    icon: item.icon,
    color: item.color,
    duration_minutes: item.default_minutes,
    mood_delta: opts?.mood ?? 0,
    semantic_kind: item.semantic_kind ?? null,
  });

  const pick = (item: CatalogItem) => {
    if (multi) {
      // Toggle i multi-select-läge — ingen detaljvy.
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(item.slug)) next.delete(item.slug);
        else next.add(item.slug);
        return next;
      });
      return;
    }
    setSelected(item);
    setDuration(item.default_minutes);
    setMood(1);
    setIntensity(null);
    setWithWho(null);
    setSleepQuality(null);
    setLocation(null);
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
      semantic_kind: selected.semantic_kind ?? null,
      intensity: selected.semantic_kind === "rorelse" ? intensity : null,
      with_who: selected.semantic_kind === "socialt" ? withWho : null,
      sleep_quality: selected.semantic_kind === "somn" ? sleepQuality : null,
      location: selected.semantic_kind === "aterhamtning" ? location : null,
    });
    onOpenChange(false);
  };

  /** Spara alla valda aktiviteter i multi-select. Varje får default-tid. */
  const confirmMulti = () => {
    if (!picked.size) return;
    const bySlug = new Map(catalog.map((c) => [c.slug, c]));
    for (const slug of picked) {
      const item = bySlug.get(slug);
      if (item) onAdd(draftFromItem(item));
    }
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
      semantic_kind: null,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[28px] max-h-[88vh] bg-background border-border-soft lg:max-w-[960px] lg:mx-auto">
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
              {favoriteItems.length > 0 && (
                <button
                  onClick={() => setActiveCat(activeCat === "__fav__" ? null : "__fav__")}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold press-soft border-2 inline-flex items-center gap-1 ${
                    activeCat === "__fav__" ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                  }`}
                >
                  <Star size={12} className="fill-current" /> Favoriter
                </button>
              )}
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

            {recentItems.length > 0 && !activeCat && !q.trim() && (
              <div className="mb-5">
                <p className="text-meta text-text-secondary mb-2">Senast använda</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {recentItems.map((item) => (
                    <PickerCard
                      key={`recent-${item.slug}`}
                      item={item}
                      isFav={favorites.has(item.slug)}
                      onPick={() => pick(item)}
                      onToggleFav={(e) => toggleFavorite(item.slug, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {favoriteItems.length > 0 && !activeCat && !q.trim() && (
              <div className="mb-5">
                <p className="text-meta text-text-secondary mb-2 inline-flex items-center gap-1">
                  <Star size={12} className="fill-current" /> Dina favoriter
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {favoriteItems.map((item) => (
                    <PickerCard
                      key={`fav-${item.slug}`}
                      item={item}
                      isFav
                      onPick={() => pick(item)}
                      onToggleFav={(e) => toggleFavorite(item.slug, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
              {filtered.map((item, i) => (
                <PickerCard
                  key={item.slug}
                  item={item}
                  isFav={favorites.has(item.slug)}
                  onPick={() => pick(item)}
                  onToggleFav={(e) => toggleFavorite(item.slug, e)}
                  delayMs={Math.min(i, 8) * 25}
                />
              ))}
              {filtered.length === 0 && q.trim() && (
                <div className="col-span-2 lg:col-span-4 card-cream p-4">
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
            <div className="rounded-3xl p-4 mb-5 flex items-center gap-3 shadow-card bg-surface border border-border-soft">
              <div
                className="shrink-0 grid place-items-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--icon-tile-radius)",
                  background: `hsl(var(--${selected.color === "yellow" ? "yellow-journal" : selected.color === "blue" ? "blue-calm" : selected.color === "purple" ? "purple-sleep" : selected.color === "pink" ? "pink-move" : selected.color === "green" ? "green-recovery" : "orange-start"}) / 0.14)`,
                }}
                aria-hidden
              >
                <AbstractIcon
                  name={selected.icon as IconName}
                  size={26}
                  color={`hsl(var(--${selected.color === "yellow" ? "yellow-journal" : selected.color === "blue" ? "blue-calm" : selected.color === "purple" ? "purple-sleep" : selected.color === "pink" ? "pink-move" : selected.color === "green" ? "green-recovery" : "orange-start"}))`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[17px] leading-tight text-foreground">{selected.label}</h3>
                <p className="text-xs text-text-secondary">{selected.category}</p>
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
                  className={`rounded-2xl px-1 py-3 flex items-center justify-center border-2 press-soft min-h-[56px] ${
                    mood === f.value ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                  }`}
                >
                  <span className="text-[11px] font-extrabold leading-tight text-center">{f.label}</span>
                </button>
              ))}
            </div>

            {selected.semantic_kind === "rorelse" && (
              <>
                <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Intensitet (valfri)</p>
                <div className="flex gap-2 mb-6">
                  {([
                    { v: "latt", label: "Lätt" },
                    { v: "medel", label: "Medel" },
                    { v: "hard", label: "Hård" },
                  ] as { v: Intensity; label: string }[]).map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setIntensity(intensity === opt.v ? null : opt.v)}
                      className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-extrabold border-2 press-soft ${
                        intensity === opt.v ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selected.semantic_kind === "socialt" && (
              <>
                <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Med vem? (valfri)</p>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {([
                    { v: "ensam", label: "Ensam" },
                    { v: "partner", label: "Partner" },
                    { v: "barn", label: "Barn" },
                    { v: "van", label: "Vän" },
                    { v: "kollega", label: "Kollega" },
                    { v: "annan", label: "Annan" },
                  ] as { v: WithWho; label: string }[]).map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setWithWho(withWho === opt.v ? null : opt.v)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold border-2 press-soft ${
                        withWho === opt.v ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selected.semantic_kind === "somn" && (
              <>
                <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Sömnkvalitet (valfri)</p>
                <div className="flex gap-2 mb-6">
                  {([
                    { v: "dalig", label: "Dålig" },
                    { v: "okej", label: "Okej" },
                    { v: "bra", label: "Bra" },
                  ] as { v: SleepQuality; label: string }[]).map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setSleepQuality(sleepQuality === opt.v ? null : opt.v)}
                      className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-extrabold border-2 press-soft ${
                        sleepQuality === opt.v ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selected.semantic_kind === "aterhamtning" && (
              <>
                <p className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Plats (valfri)</p>
                <div className="flex gap-2 mb-6">
                  {([
                    { v: "inne", label: "Inne" },
                    { v: "ute", label: "Ute" },
                  ] as { v: Location; label: string }[]).map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setLocation(location === opt.v ? null : opt.v)}
                      className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-extrabold border-2 press-soft ${
                        location === opt.v ? "bg-foreground text-background border-foreground" : "bg-surface text-foreground border-border-soft"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}

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
