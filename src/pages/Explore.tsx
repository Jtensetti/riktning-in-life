import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { ColorCard, type CardTone } from "@/components/ColorCard";
import { ChevronRight } from "lucide-react";

type Exercise = { id: string; title: string; category: string; duration_minutes: number; color: string };
type Sequence = { slug: string; title: string; description: string; color: string };
type Article = { slug: string; title: string; excerpt: string; color: string; read_minutes: number; category: string };

const asTone = (c: string): CardTone => {
  switch (c) {
    case "orange": case "blue": case "yellow": case "purple": case "pink": case "green": return c;
    default: return "orange";
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

const Explore = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("exercises").select("id,title,category,duration_minutes,color").order("category").limit(12),
      supabase.from("exercise_sequences").select("slug,title,description,color").order("created_at", { ascending: true }).limit(8),
      supabase.from("learn_articles").select("slug,title,excerpt,color,read_minutes,category").order("created_at", { ascending: true }).limit(8),
    ]).then(([ex, sq, ar]) => {
      setExercises((ex.data ?? []) as Exercise[]);
      setSequences((sq.data ?? []) as Sequence[]);
      setArticles((ar.data ?? []) as Article[]);
    });
  }, [user]);

  return (
    <AppShell wide>
      <ScreenHeader
        screen="explore"
        title="Utforska"
        subtitle="Övningar, rutiner och korta texter."
      />

      {/* Övningar — carousell, större kort, kategori syns i färgen */}
      <section className="mb-10 -mx-6">
        <div className="px-6 mb-4 flex items-baseline justify-between">
          <h3 className="text-xl">Övningar</h3>
          <button onClick={() => navigate("/ovningar")} className="text-xs font-extrabold text-orange-deep press-soft">Se alla</button>
        </div>
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 px-6 pb-3 -mb-3">
          {exercises.slice(0, 8).map((e, i) => (
            <ColorCard
              key={e.id}
              tone={asTone(e.color)}
              size="lg"
              index={i}
              onClick={() => navigate(`/ovningar/${e.id}`)}
              ariaLabel={`${e.title}, ${e.duration_minutes} minuter`}
              className="shrink-0 w-[80%] snap-start"
              lead={{ value: e.duration_minutes, unit: "min" }}
              title={e.title}
              metaLeft={e.category}
              showChevron
            />
          ))}
          {exercises.length === 0 && (
            <p className="text-sm text-text-secondary px-2">Laddar…</p>
          )}
        </div>
      </section>

      {/* Rutiner — stora färgade hjältekort, ingen ikon-tile */}
      <section className="mb-10">
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

      {/* Lär dig — färgad vänsterruta med stor läs-minut-siffra istället för ikon */}
      <section className="mb-8">
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
    </AppShell>
  );
};

export default Explore;
