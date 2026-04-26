import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { AbstractIcon } from "@/components/AbstractIcon";
import { ColorCard, type CardTone } from "@/components/ColorCard";
import { ChevronRight, Clock } from "lucide-react";

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
    <AppShell>
      <HeroBanner
        tone="var(--pink-move)"
        icon="spark"
        iconColor="hsl(var(--surface))"
      />
      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Utforska</h1>
        <p className="text-sm text-text-secondary">Övningar, rutiner och korta texter att lära dig av.</p>
      </header>

      {/* Övningar */}
      <section className="mb-8 -mx-6">
        <div className="px-6 mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-xl">Övningar</h3>
            <p className="text-sm text-text-secondary">Korta, riktade verktyg</p>
          </div>
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
              className="shrink-0 w-[72%] snap-start"
              eyebrow={[{ label: e.category, variant: "soft" }]}
              lead={{ value: e.duration_minutes, unit: "min" }}
              title={e.title}
              showChevron
            />
          ))}
          {exercises.length === 0 && (
            <p className="text-sm text-text-secondary px-2">Laddar…</p>
          )}
        </div>
      </section>

      {/* Rutiner */}
      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-xl">Rutiner</h3>
            <p className="text-sm text-text-secondary">Färdiga paket för morgon, dag och kväll</p>
          </div>
          <button onClick={() => navigate("/rutiner")} className="text-xs font-extrabold text-orange-deep press-soft">Se alla</button>
        </div>
        <div className="space-y-3">
          {sequences.slice(0, 4).map((s, i) => (
            <button
              key={s.slug}
              onClick={() => navigate("/rutiner")}
              className={`w-full ${colorBg(s.color)} ${colorText(s.color)} rounded-3xl p-4 text-left shadow-soft press-soft animate-pop-in flex items-center gap-3`}
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <div className={`shrink-0 w-12 h-12 grid place-items-center rounded-2xl ${s.color === "yellow" ? "bg-foreground/10" : "bg-white/20"}`}>
                <AbstractIcon name="play-soft-circle" size={22} color="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[16px] leading-tight font-extrabold mb-0.5">{s.title}</h4>
                <p className="text-xs opacity-90 line-clamp-2">{s.description}</p>
              </div>
              <ChevronRight size={18} className="shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Lär dig */}
      <section className="mb-7">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-xl">Lär dig</h3>
            <p className="text-sm text-text-secondary">Korta texter med forskningsstöd</p>
          </div>
          <button onClick={() => navigate("/lar-dig")} className="text-xs font-extrabold text-orange-deep press-soft">Se alla</button>
        </div>
        <div className="space-y-3">
          {articles.slice(0, 4).map((a, i) => (
            <button
              key={a.slug}
              onClick={() => navigate(`/lar-dig/${a.slug}`)}
              className="w-full card-cream p-4 text-left flex items-start gap-3 press-soft animate-fade-in-up"
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <div className={`shrink-0 w-12 h-12 grid place-items-center rounded-2xl ${colorBg(a.color)} ${colorText(a.color)}`}>
                <AbstractIcon name="book-open" size={22} color="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-0.5 inline-flex items-center gap-1.5">
                  <Clock size={10} strokeWidth={2.6} /> {a.read_minutes} min · {a.category}
                </p>
                <h4 className="text-[15px] leading-tight font-extrabold mb-1">{a.title}</h4>
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
