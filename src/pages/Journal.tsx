import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";

type TemplateKey = "three_lines" | "thought_loop" | "body_first" | "evidence" | "free";

const TEMPLATES: Record<TemplateKey, {
  title: string; subtitle: string; bg: string; text: string;
  tone: string;
  icon: IconName;
  iconColor: string;
  fields: { key: string; label: string; placeholder?: string }[];
}> = {
  three_lines: {
    title: "Tre rader",
    subtitle: "En liten avstamp för dagen",
    bg: "bg-yellow-journal", text: "text-foreground",
    ill: "journal", icon: "pencil-soft", iconColor: "hsl(var(--orange-start))",
    fields: [
      { key: "heaviest", label: "Det tyngsta idag var" },
      { key: "helped", label: "Något som hjälpte lite var" },
      { key: "tomorrow", label: "Imorgon behöver jag" },
    ],
  },
  thought_loop: {
    title: "Tankeloop",
    subtitle: "Fakta vs tolkning",
    bg: "bg-orange-start", text: "text-white",
    ill: "thoughtLoop", icon: "spark", iconColor: "hsl(var(--yellow-journal))",
    fields: [
      { key: "thought", label: "Tanken som fastnat" },
      { key: "for", label: "Fakta som stödjer den" },
      { key: "against", label: "Fakta som talar emot" },
      { key: "reframe", label: "En rimligare formulering" },
    ],
  },
  body_first: {
    title: "Kropp först",
    subtitle: "Lyssna på kroppens signaler",
    bg: "bg-blue-calm", text: "text-white",
    ill: "bodyScan", icon: "heart-pulse", iconColor: "hsl(var(--surface))",
    fields: [
      { key: "where", label: "Var sitter känslan?" },
      { key: "signal", label: "Vad signalerar kroppen?" },
      { key: "release", label: "Vad kan minska trycket 5 %?" },
    ],
  },
  evidence: {
    title: "Bevislogg",
    subtitle: "Vad gjorde du trots motstånd?",
    bg: "bg-green-recovery", text: "text-white",
    ill: "focus", icon: "flag", iconColor: "hsl(var(--yellow-journal))",
    fields: [
      { key: "did", label: "Vad gjorde jag trots motstånd?" },
      { key: "means", label: "Vad säger det som depressionen inte säger?" },
      { key: "remember", label: "Vad vill jag minnas?" },
    ],
  },
  free: {
    title: "Fri text",
    subtitle: "Skriv vad du vill",
    bg: "bg-pink-move", text: "text-white",
    ill: "journal", icon: "bookmark-soft", iconColor: "hsl(var(--surface))",
    fields: [],
  },
};

type Entry = {
  id: string;
  date: string;
  template_type: string;
  title: string | null;
  free_text: string | null;
  body_json: any;
  include_in_report: boolean;
  created_at: string;
};

const Journal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [active, setActive] = useState<TemplateKey | null>(null);
  const [body, setBody] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [free, setFree] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setEntries((data ?? []) as Entry[]);
    setFetching(false);
  };

  useEffect(() => { load(); }, [user]);

  const startTemplate = (k: TemplateKey) => {
    setActive(k);
    setBody({});
    setTitle("");
    setFree("");
  };

  const save = async () => {
    if (!user || !active) return;
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      template_type: active,
      title: title || null,
      body_json: body,
      free_text: active === "free" ? free : null,
    });
    setSaving(false);
    if (error) {
      toast.error("Kunde inte spara");
      return;
    }
    toast.success("Sparat");
    setActive(null);
    load();
  };

  if (loading || fetching) {
    return <AppShell><div className="h-40 rounded-3xl bg-surface-alt animate-pulse" /></AppShell>;
  }

  if (active) {
    const t = TEMPLATES[active];
    const canSave = active === "free" ? free.trim().length > 0 : Object.values(body).some(v => v?.trim());
    return (
      <AppShell>
        <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4 press-soft">
          <ChevronLeft size={18} /> Tillbaka
        </button>
        <div className={`rounded-3xl ${t.bg} p-1 mb-6 overflow-hidden shadow-soft animate-pop-in`}>
          <div className="rounded-[20px] overflow-hidden">
            <Illustration name={t.ill} className="w-full h-auto" />
          </div>
          <div className={`px-4 pb-4 pt-3 ${t.text}`}>
            <h1 className="text-[28px] leading-[34px] mb-1">{t.title}</h1>
            <p className="text-sm opacity-90">{t.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Titel (valfritt)</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ge dagen en titel" className="h-12 rounded-2xl bg-surface" />
          </div>
          {active === "free" ? (
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Skriv fritt</label>
              <Textarea value={free} onChange={e => setFree(e.target.value)} placeholder="Tankar, känslor, dagen…" className="min-h-[200px] rounded-2xl bg-surface text-base" />
            </div>
          ) : (
            t.fields.map((f, i) => (
              <div key={f.key} className="animate-fade-in-up" style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}>
                <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">{f.label}</label>
                <Textarea
                  value={body[f.key] ?? ""}
                  onChange={e => setBody(b => ({ ...b, [f.key]: e.target.value }))}
                  className="min-h-[80px] rounded-2xl bg-surface text-base"
                />
              </div>
            ))
          )}
        </div>

        <Button
          disabled={!canSave || saving}
          onClick={save}
          className="w-full h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px] press-soft"
        >
          {saving ? "Sparar…" : "Spara"}
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <HeroBanner
        tone="var(--yellow-journal)"
        icon="pencil-soft"
        iconColor="hsl(var(--orange-start))"
      />

      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Journal</h1>
        <p className="text-sm text-text-secondary">Spara dagen som den var.</p>
      </header>

      <h2 className="text-lg font-extrabold mb-3">Mallar</h2>
      <div className="space-y-3 mb-8">
        {(Object.keys(TEMPLATES) as TemplateKey[]).map((k, i) => {
          const t = TEMPLATES[k];
          return (
            <button
              key={k}
              onClick={() => startTemplate(k)}
              className={`w-full text-left rounded-3xl ${t.bg} ${t.text} px-5 py-4 shadow-card press-soft animate-fade-in-up flex items-center justify-between gap-3`}
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})`, minHeight: "84px" }}
            >
              <div className="min-w-0">
                <div className="text-[17px] font-extrabold leading-tight">{t.title}</div>
                <div className="text-[12px] opacity-90 mt-0.5">{t.subtitle}</div>
              </div>
              <div className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl bg-white/20">
                <AbstractIcon name={t.icon} size={24} color={t.iconColor} />
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
        <AbstractIcon name="bookmark-soft" size={18} color="hsl(var(--blue-calm))" />
        Historik
      </h2>
      {entries.length === 0 ? (
        <div className="card-cream p-6 text-center">
          <div className="grid place-items-center mx-auto mb-2">
            <AbstractIcon name="pencil-soft" size={32} color="hsl(var(--text-secondary))" />
          </div>
          <p className="text-sm text-text-secondary">Inga anteckningar än. Börja med Tre rader.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e, i) => {
            const t = TEMPLATES[e.template_type as TemplateKey];
            const preview = e.free_text ?? Object.values(e.body_json ?? {}).filter(Boolean).join(" · ");
            const toggleReport = async () => {
              await supabase.from("journal_entries").update({ include_in_report: !e.include_in_report }).eq("id", e.id);
              load();
            };
            return (
              <li
                key={e.id}
                className="card-soft p-4 flex gap-3 items-start animate-fade-in-up"
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className={`w-2 self-stretch rounded-full ${t?.bg ?? "bg-surface-alt"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[15px] font-extrabold truncate">{e.title || t?.title || "Anteckning"}</span>
                    <span className="text-[11px] font-semibold text-text-secondary shrink-0">
                      {new Date(e.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {preview && <p className="text-sm text-text-secondary line-clamp-2 mb-2">{preview}</p>}
                  <button
                    onClick={toggleReport}
                    className={`pill text-[11px] press-soft ${e.include_in_report ? "bg-blue-calm text-white" : "bg-surface-alt text-text-secondary"}`}
                  >
                    {e.include_in_report ? "✓ Inkluderas i rapport" : "Inkludera i rapport"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
};

export default Journal;
