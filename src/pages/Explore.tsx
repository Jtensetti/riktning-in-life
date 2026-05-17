import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { ColorCard, type CardTone } from "@/components/ColorCard";
import { ChevronRight, Sparkles, History } from "lucide-react";
import { SITUATIONS, exercisesForSituation, type Situation } from "@/lib/exerciseSituations";

type Exercise = {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  color: string;
};
type Sequence = { slug: string; title: string; description: string; color: string };
type Article = {
  slug: string;
  title: string;
  excerpt: string;
  color: string;
  read_minutes: number;
  category: string;
};

const asTone = (c: string): CardTone => {
  switch (c) {
    case "orange":
    case "blue":
    case "yellow":
    case "purple":
    case "pink":
    case "green":
      return c;
    default:
      return "orange";
  }
};

const colorBg = (c: string) => {
  switch (c) {
    case "orange": return "bg-orange-start";
    case "blue": return "bg-blue-calm";
    case "yellow": return "bg-yellow-journal";
    case "purple": return "bg-purple-sleep";
    case "pink": return "bg-pink-move";
    case "green": return "bg-green-recovery";
    default: return "bg-cream-card";
  }
};
const colorText = (c: string) => (c === "yellow" || c === "" ? "text-foreground" : "text-white");

const toneBg: Record<Situation["tone"], string> = {
  blue: "bg-blue-calm/15 text-blue-calm",
  green: "bg-green-recovery/15 text-green-recovery",
  orange: "bg-orange-start/15 text-orange-deep",
  purple: "bg-purple-sleep/15 text-purple-sleep",
  pink: "bg-pink-move/15 text-pink-move",
  yellow: "bg-yellow-journal/25 text-foreground",
};

// Förenklad tid-på-dygnet → kategori-prioritet, samma anda som pickerRecommend.
const timeOfDayCategories = (h: number): string[] => {
  if (h < 5) return ["Sov bättre", "Lugna kroppen"];
  if (h < 10) return ["Kom igång", "Rör dig mjukt", "Mat & humör"];
  if (h < 17) return ["Rör dig mjukt", "Sociala mikrosteg", "Bryt ältande"];
  if (h < 22) return ["Lugna kroppen", "Skriv av dig", "Sov bättre"];
  return ["Sov bättre", "Lugna kroppen"];
};

const timeOfDayLabel = (h: number): string => {
  if (h < 5) return "Natten brukar bli lugnare med dessa.";
  if (h < 10) return "Mjuka start på morgonen.";
  if (h < 17) return "Passar mitt i en vanlig dag.";
  if (h < 22) return "Hjälper kvällen att landa.";
  return "Sömnstöd nu när det är sent.";
};

const Explore = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("exercises").select("id,title,category,duration_minutes,color").order("category"),
      supabase.from("exercise_sequences").select("slug,title,description,color").order("created_at", { ascending: true }).limit(8),
      supabase.from("learn_articles").select("slug,title,excerpt,color,read_minutes,category").order("created_at", { ascending: true }).limit(8),
      supabase.from("exercise_sessions").select("exercise_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]).then(([ex, sq, ar, ss]) => {
      setExercises((ex.data ?? []) as Exercise[]);
      setSequences((sq.data ?? []) as Sequence[]);
      setArticles((ar.data ?? []) as Article[]);
      const seen = new Set<string>();
      const ids: string[] = [];
      ((ss.data ?? []) as { exercise_id: string }[]).forEach((s) => {
        if (s.exercise_id && !seen.has(s.exercise_id)) {
          seen.add(s.exercise_id);
          ids.push(s.exercise_id);
        }
      });
      setRecentIds(ids.slice(0, 4));
    });
  }, [user]);

  const now = new Date();
  const hour = now.getHours();
  const todCats = useMemo(() => timeOfDayCategories(hour), [hour]);

  const recommended = useMemo(() => {
    if (!exercises.length) return [];
    const scored = exercises.map((e) => {
      const idx = todCats.indexOf(e.category);
      const score = idx === -1 ? 0 : todCats.length - idx;
      return { e, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.e);
  }, [exercises, todCats]);

  const continueWith = useMemo(() => {
    if (!recentIds.length) return [];
    const map = new Map(exercises.map((e) => [e.id, e]));
    return recentIds.map((id) => map.get(id)).filter((x): x is Exercise => Boolean(x));
  }, [recentIds, exercises]);

  return (
    <AppShell wide>
      <ScreenHeader
        screen="explore"
        title="Utforska"
        subtitle="Hitta något att göra utifrån hur dagen känns."
      />

      {/* Topprader: rekommenderat + fortsätt */}
      <section className="mb-10 space-y-8">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-xl inline-flex items-center gap-2">
              <Sparkles size={16} className="text-orange-deep" />
              Rekommenderat just nu
            </h3>
            <span className="text-xs text-text-secondary">{timeOfDayLabel(hour)}</span>
          </div>
          {recommended.length === 0 ? (
            <p className="text-sm text-text-secondary">Vi behöver lite mer data för att föreslå något passande. Prova en kategori nedan.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {recommended.map((e, i) => (
                <ColorCard
                  key={e.id}
                  tone={asTone(e.color)}
                  size="md"
                  index={i}
                  onClick={() => navigate(`/ovningar/${e.id}`)}
                  ariaLabel={`${e.title}, ${e.duration_minutes} minuter`}
                  lead={{ value: e.duration_minutes, unit: "min" }}
                  title={e.title}
                  metaLeft={e.category}
                  showChevron
                />
              ))}
            </div>
          )}
        </div>

        {continueWith.length > 0 && (
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-xl inline-flex items-center gap-2">
                <History size={16} className="text-text-secondary" />
                Fortsätt där du var
              </h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {continueWith.map((e, i) => (
                <ColorCard
                  key={e.id}
                  tone={asTone(e.color)}
                  size="md"
                  index={i}
                  onClick={() => navigate(`/ovningar/${e.id}`)}
                  ariaLabel={`Fortsätt: ${e.title}`}
                  lead={{ value: e.duration_minutes, unit: "min" }}
                  title={e.title}
                  metaLeft={e.category}
                  showChevron
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Situationsbibliotek */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-xl">Övningar efter situation</h3>
          <button
            onClick={() => navigate("/ovningar")}
            className="text-xs font-extrabold text-orange-deep press-soft"
          >
            Se alla
          </button>
        </div>
        <div className="space-y-8">
          {SITUATIONS.map((sit) => {
            const items = exercisesForSituation(exercises, sit).slice(0, 6);
            if (items.length === 0) return null;
            return (
              <div key={sit.key}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${toneBg[sit.tone]} mb-1`}>
                      Situation
                    </span>
                    <h4 className="text-lg font-extrabold leading-tight">{sit.title}</h4>
                    <p className="text-xs text-text-secondary">{sit.blurb}</p>
                  </div>
                </div>
                <div className="overflow-x-auto lg:overflow-visible scrollbar-hide snap-x snap-mandatory flex lg:grid lg:grid-cols-3 gap-3 -mx-6 lg:mx-0 px-6 lg:px-0 pb-3 lg:pb-0">
                  {items.map((e, i) => (
                    <ColorCard
                      key={e.id}
                      tone={asTone(e.color)}
                      size="md"
                      index={i}
                      onClick={() => navigate(`/ovningar/${e.id}`)}
                      ariaLabel={`${e.title}, ${e.duration_minutes} minuter`}
                      className="shrink-0 w-[70%] lg:w-full snap-start"
                      lead={{ value: e.duration_minutes, unit: "min" }}
                      title={e.title}
                      metaLeft={e.category}
                      showChevron
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rutiner + Lär dig: överblick i två kolumner på desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        <section className="mb-10 lg:mb-0">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-xl">Rutiner</h3>
            <button onClick={() => navigate("/rutiner")} className="text-xs font-extrabold text-orange-deep press-soft">Se alla</button>
          </div>
          <div className="space-y-4">
            {sequences.slice(0, 4).map((s, i) => (
              <button
                key={s.slug}
                onClick={() => navigate(`/rutiner/${s.slug}`)}
                className={`relative overflow-hidden w-full ${colorBg(s.color)} ${colorText(s.color)} card-hero press-soft animate-pop-in`}
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <span aria-hidden className="pointer-events-none absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-white/10" />
                <div className="relative z-[1] flex items-end justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-80 mb-2">Rutin</p>
                    <h4 className="text-2xl leading-[28px] font-extrabold mb-2">{s.title}</h4>
                    <p className="text-sm opacity-90 line-clamp-2">{s.description}</p>
                  </div>
                  <ChevronRight size={22} className="shrink-0 opacity-90" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 lg:mb-0">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-xl">Lär dig</h3>
            <button onClick={() => navigate("/lar-dig")} className="text-xs font-extrabold text-orange-deep press-soft">Se alla</button>
          </div>
          <div className="space-y-4">
            {articles.slice(0, 4).map((a, i) => (
              <button
                key={a.slug}
                onClick={() => navigate(`/lar-dig/${a.slug}`)}
                className="w-full card-cream p-5 text-left flex items-stretch gap-4 press-soft animate-fade-in-up"
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className={`shrink-0 w-16 rounded-2xl ${colorBg(a.color)} ${colorText(a.color)} grid place-items-center`}>
                  <div className="text-center leading-none">
                    <div className="text-[28px] font-extrabold tabular-nums">{a.read_minutes}</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-90 mt-0.5">min</div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1">{a.category}</p>
                  <h4 className="text-[16px] leading-tight font-extrabold mb-1">{a.title}</h4>
                  <p className="text-xs text-text-secondary leading-snug line-clamp-2">{a.excerpt}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Explore;
