// AI-veckosammanfattning — kort, varmt kort som hämtas från
// `weekly-insight`-edge-functionen (eller cache i `weekly_insights`).
// Renderar tomt ingenting när datan är tunn eller AI-tjänsten inte svarar —
// appen ska alltid fungera utan AI.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Insight = {
  headline: string;
  trend_summary: string;
  bright_spot: string;
  one_thing_to_try: string;
  flags: string[];
};

type Resp = { insight: Insight; cached: boolean; week_start: string } | { error: string; message?: string };

export const WeeklyAIInsight = ({ minDays = 4 }: { minDays?: number }) => {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState(false);

  const fetchInsight = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke<Resp>("weekly-insight", {
        body: { force },
      });
      if (error) throw error;
      if (data && "insight" in data) {
        setInsight(data.insight);
      } else if (data && "error" in data) {
        if (data.error === "rate_limited" || data.error === "credits_exhausted") {
          toast.message(data.message ?? "AI-tjänsten är upptagen just nu.");
        }
        setHidden(true);
      }
    } catch (e) {
      // Tyst fail — kortet göms helt enkelt
      console.warn("weekly-insight failed:", e);
      setHidden(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Snabb pre-check: räkna att vi har minst minDays check-ins.
      const { data: rows } = await supabase
        .from("daily_checkins")
        .select("date")
        .order("date", { ascending: false })
        .limit(14);
      if (cancelled) return;
      if (!rows || rows.length < minDays) {
        setHidden(true);
        setLoading(false);
        return;
      }
      void fetchInsight(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDays]);

  if (hidden) return null;

  if (loading) {
    return (
      <div className="card-cream p-5 mb-4 animate-pulse">
        <div className="h-3 w-24 rounded-full bg-surface-alt mb-3" />
        <div className="h-4 w-3/4 rounded-full bg-surface-alt mb-2" />
        <div className="h-3 w-full rounded-full bg-surface-alt mb-1.5" />
        <div className="h-3 w-5/6 rounded-full bg-surface-alt" />
      </div>
    );
  }

  if (!insight) return null;

  return (
    <section className="card-cream p-5 mb-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-orange-deep" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-text-secondary">
            Veckans bild
          </span>
        </div>
        <button
          type="button"
          onClick={() => fetchInsight(true)}
          disabled={refreshing}
          className="text-text-secondary press-soft p-1"
          aria-label="Uppdatera"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <h3 className="text-[20px] leading-tight font-extrabold mb-2">{insight.headline}</h3>
      <p className="text-sm text-foreground/90 mb-3 whitespace-pre-line">{insight.trend_summary}</p>

      {insight.bright_spot && (
        <div className="mb-3 rounded-2xl bg-surface-alt/60 p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-secondary mb-1">
            Ett ljus
          </p>
          <p className="text-sm">{insight.bright_spot}</p>
        </div>
      )}

      {insight.one_thing_to_try && (
        <div className="rounded-2xl border border-border-soft p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-secondary mb-1">
            En sak att prova
          </p>
          <p className="text-sm">{insight.one_thing_to_try}</p>
        </div>
      )}

      {insight.flags && insight.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {insight.flags.map((f) => (
            <span
              key={f}
              className="text-[10px] font-extrabold uppercase tracking-wide rounded-full bg-surface-alt px-2 py-1 text-text-secondary"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};
