import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { AbstractIcon } from "@/components/AbstractIcon";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  color: string;
  read_minutes: number;
  excerpt: string;
};

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

const Learn = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Article[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("learn_articles")
      .select("id,slug,title,category,color,read_minutes,excerpt")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data as Article[]);
      });
  }, [user]);

  return (
    <AppShell wide>
      <ScreenHeader
        screen="explore"
        title="Lär dig"
        subtitle="Korta texter — varför saker funkar, och vad du kan pröva."
        topLeft={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-bold opacity-90 press-soft"
          >
            <ChevronLeft size={18} /> Tillbaka
          </button>
        }
      />

      <div className="space-y-3">
        {items.map((a, i) => (
          <button
            key={a.id}
            onClick={() => navigate(`/lar-dig/${a.slug}`)}
            className={`w-full text-left rounded-3xl ${colorBg(a.color)} ${colorText(a.color)} p-5 shadow-soft press-soft animate-pop-in flex items-start gap-4`}
            style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  a.color === "yellow" ? "bg-foreground/10" : "bg-white/20"
                }`}>
                  {a.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold opacity-80">
                  <Clock size={11} strokeWidth={2.6} /> {a.read_minutes} min
                </span>
              </div>
              <h3 className="text-[18px] leading-[22px] font-extrabold mb-1.5">{a.title}</h3>
              <p className="text-sm opacity-90 leading-snug">{a.excerpt}</p>
            </div>
            <ChevronRight size={20} className="shrink-0 mt-1" />
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">Inga artiklar ännu.</p>
        )}
      </div>
    </AppShell>
  );
};

export default Learn;
