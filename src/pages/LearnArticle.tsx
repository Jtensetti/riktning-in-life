import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AbstractIcon } from "@/components/AbstractIcon";

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  color: string;
  read_minutes: number;
  excerpt: string;
  body_md: string;
  related_exercise_ids_json: string[];
  sources_json: { source: string; year?: number; url?: string }[];
};

type RelatedEx = { id: string; title: string; category: string; duration_minutes: number; color: string };

const colorBg = (color: string): string => {
  switch (color) {
    case "orange": return "bg-orange-start";
    case "blue": return "bg-blue-calm";
    case "yellow": return "bg-yellow-journal";
    case "purple": return "bg-purple-sleep";
    case "pink": return "bg-pink-move";
    case "green": return "bg-green-recovery";
    default: return "bg-cream-card";
  }
};

const colorText = (color: string): string =>
  color === "yellow" || color === "" ? "text-foreground" : "text-white";

const LearnArticle = () => {
  const { slug } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<RelatedEx[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!slug || !user) return;
    supabase
      .from("learn_articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const a: Article = {
          ...data,
          related_exercise_ids_json: (data.related_exercise_ids_json as string[]) ?? [],
          sources_json: (data.sources_json as Article["sources_json"]) ?? [],
        };
        setArticle(a);
        if (a.related_exercise_ids_json.length > 0) {
          const { data: exs } = await supabase
            .from("exercises")
            .select("id,title,category,duration_minutes,color")
            .in("id", a.related_exercise_ids_json);
          setRelated((exs ?? []) as RelatedEx[]);
        }
      });
  }, [slug, user]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-text-secondary">
        Hämtar...
      </div>
    );
  }

  const txt = colorText(article.color);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className={`${colorBg(article.color)} ${txt} px-6 pt-8 pb-10 rounded-b-[36px] relative overflow-hidden`}>
        <div className="max-w-md lg:max-w-[720px] mx-auto relative">
          <button
            onClick={() => navigate("/lar-dig")}
            className="flex items-center gap-1 text-sm font-bold mb-4 opacity-90 press-soft"
          >
            <ChevronLeft size={18} /> Lär dig
          </button>
          <div className="absolute right-0 top-0 opacity-90 pointer-events-none">
            <AbstractIcon name="bookmark-soft" size={64} color="currentColor" />
          </div>
          <div className="flex items-center gap-2 mb-3 mt-12">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              article.color === "yellow" ? "bg-foreground/10" : "bg-white/20"
            }`}>
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold opacity-80">
              <Clock size={11} strokeWidth={2.6} /> {article.read_minutes} min läsning
            </span>
          </div>
          <h1 className="text-[28px] leading-[34px] mb-2">{article.title}</h1>
          <p className="text-sm opacity-90 leading-snug">{article.excerpt}</p>
        </div>
      </div>

      <div className="max-w-md lg:max-w-[720px] mx-auto px-6 -mt-2">
        <article className="card-soft p-5 mb-5 prose-riktning">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.body_md}
          </ReactMarkdown>
        </article>

        {related.length > 0 && (
          <section className="mb-5">
            <h3 className="text-lg mb-3">Pröva nu</h3>
            <div className="space-y-3">
              {related.map((ex, i) => (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/ovningar/${ex.id}`)}
                  className="w-full text-left rounded-3xl bg-surface border border-border-soft p-4 flex items-center gap-3 shadow-card press-soft animate-fade-in-up"
                  style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
                >
                  <div className={`w-10 h-10 rounded-2xl shrink-0 ${colorBg(ex.color)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold truncate">{ex.title}</p>
                    <p className="text-xs text-text-secondary">{ex.category} · {ex.duration_minutes} min</p>
                  </div>
                  <ChevronRight size={18} className="text-text-secondary shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {article.sources_json.length > 0 ? (
          <section className="mb-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-secondary mb-2">
              Stöd i forskningen
            </h3>
            <div className="card-cream p-4 space-y-1.5">
              {article.sources_json.map((s, i) => {
                const label = (s as any).source ?? (s as any).title ?? "";
                const url = (s as any).url as string | undefined;
                return (
                  <p key={i} className="text-xs text-text-secondary leading-snug">
                    · {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                        {label}
                      </a>
                    ) : label}
                    {s.year ? ` (${s.year})` : ""}
                  </p>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mb-5">
            <div className="card-cream p-4">
              <p className="text-xs text-text-secondary leading-snug italic">
                Bygger på klinisk praxis snarare än en specifik studie.
              </p>
            </div>
          </section>
        )}

        <Button
          onClick={() => navigate("/lar-dig")}
          variant="secondary"
          className="w-full h-12 rounded-full font-extrabold press-soft"
        >
          Tillbaka till Lär dig
        </Button>
      </div>
    </div>
  );
};

export default LearnArticle;
