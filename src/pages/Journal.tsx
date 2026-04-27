import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { htmlToPreviewText } from "@/lib/htmlText";

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
    tone: "var(--yellow-journal)", icon: "pencil-soft", iconColor: "hsl(var(--orange-start))",
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
    tone: "var(--orange-start)", icon: "spark", iconColor: "hsl(var(--yellow-journal))",
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
    tone: "var(--blue-calm)", icon: "heart-pulse", iconColor: "hsl(var(--surface))",
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
    tone: "var(--green-recovery)", icon: "flag", iconColor: "hsl(var(--yellow-journal))",
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
    tone: "var(--pink-move)", icon: "bookmark-soft", iconColor: "hsl(var(--surface))",
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

  // Cmd/Ctrl+Enter saves on desktop when an editor is open.
  const onEditorKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      const canSave = active === "free" ? free.trim().length > 0 : Object.values(body).some(v => v?.trim());
      if (canSave && !saving) save();
    }
  };

  // ===== Mobile editor (active template) — UNCHANGED markup, hidden on desktop. =====
  if (active) {
    const t = TEMPLATES[active];
    const canSave = active === "free" ? free.trim().length > 0 : Object.values(body).some(v => v?.trim());
    const editorBody = (compact: boolean) => (
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Titel (valfritt)</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ge dagen en titel" className="h-12 rounded-2xl bg-surface" />
        </div>
        {active === "free" ? (
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Skriv fritt</label>
            <RichTextEditor
              value={free}
              onChange={setFree}
              placeholder="Tankar, känslor, dagen…"
              minHeight={compact ? 220 : 420}
              onSubmit={compact ? undefined : save}
            />
          </div>
        ) : (
          t.fields.map((f, i) => (
            <div key={f.key} className="animate-fade-in-up" style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}>
              <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">{f.label}</label>
              <Textarea
                value={body[f.key] ?? ""}
                onChange={e => setBody(b => ({ ...b, [f.key]: e.target.value }))}
                onKeyDown={compact ? undefined : onEditorKeyDown}
                className={`rounded-2xl bg-surface text-base ${compact ? "min-h-[80px]" : "min-h-[120px]"}`}
              />
            </div>
          ))
        )}
      </div>
    );

    return (
      <>
        {/* Mobile: full-page editor — original markup preserved verbatim. */}
        <div className="lg:hidden">
          <AppShell>
            <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4 press-soft">
              <ChevronLeft size={18} /> Tillbaka
            </button>
            <div
              className={`-mx-6 mb-6 px-6 pt-6 pb-7 rounded-b-[28px] flex items-center gap-4 ${t.text}`}
              style={{ background: `hsl(${t.tone})` }}
            >
              <AbstractIcon name={t.icon} size={48} color={t.iconColor} inline />
              <div className="flex-1 min-w-0">
                <h1 className="text-h2 mb-0.5">{t.title}</h1>
                <p className="text-body opacity-90">{t.subtitle}</p>
              </div>
            </div>

            {editorBody(true)}

            <Button
              disabled={!canSave || saving}
              onClick={save}
              variant="pill-brand"
              size="pill"
              className="w-full"
            >
              {saving ? "Sparar…" : "Spara"}
            </Button>
          </AppShell>
        </div>

        {/* Desktop: split-pane inline editor + template list. */}
        <div className="hidden lg:block">
          <AppShell wide>
            <div className="grid grid-cols-[1fr_320px] gap-6">
              {/* Left: editor */}
              <div>
                <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-3 press-soft">
                  <ChevronLeft size={18} /> Tillbaka till mallar
                </button>
                <div
                  className={`mb-5 px-6 pt-5 pb-6 rounded-3xl flex items-center gap-4 ${t.text}`}
                  style={{ background: `hsl(${t.tone})` }}
                >
                  <AbstractIcon name={t.icon} size={44} color={t.iconColor} inline />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-h2 mb-0.5">{t.title}</h1>
                    <p className="text-body opacity-90">{t.subtitle}</p>
                  </div>
                </div>

                {editorBody(false)}

                <div className="flex items-center gap-3">
                  <Button
                    disabled={!canSave || saving}
                    onClick={save}
                    variant="pill-brand"
                    size="pill"
                  >
                    {saving ? "Sparar…" : "Spara"}
                  </Button>
                  <span className="text-xs text-text-secondary">Tips: ⌘/Ctrl + Enter för att spara</span>
                </div>
              </div>

              {/* Right: template switcher + recent history */}
              <aside className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Byt mall</h3>
                  <ul className="space-y-1.5">
                    {(Object.keys(TEMPLATES) as TemplateKey[]).map(k => {
                      const tt = TEMPLATES[k];
                      const isActive = k === active;
                      return (
                        <li key={k}>
                          <button
                            onClick={() => startTemplate(k)}
                            className={`w-full flex items-center gap-3 px-3 h-11 rounded-2xl press-soft transition-colors ${isActive ? "bg-surface-alt" : "hover:bg-surface-alt/60"}`}
                          >
                            <span className={`w-2 h-8 rounded-full ${tt.bg}`} />
                            <span className="text-[14px] font-extrabold flex-1 text-left">{tt.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">Senaste</h3>
                  {entries.length === 0 ? (
                    <p className="text-sm text-text-secondary">Inga anteckningar än.</p>
                  ) : (
                    <ul className="space-y-2">
                      {entries.slice(0, 8).map(e => {
                        const tt = TEMPLATES[e.template_type as TemplateKey];
                        return (
                          <li key={e.id} className="card-soft p-3">
                            <div className="flex items-baseline justify-between gap-2 mb-0.5">
                              <span className="text-[13px] font-extrabold truncate">{e.title || tt?.title || "Anteckning"}</span>
                              <span className="text-[10px] font-semibold text-text-secondary shrink-0">
                                {new Date(e.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary line-clamp-2">
                              {e.free_text ?? Object.values(e.body_json ?? {}).filter(Boolean).join(" · ")}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </AppShell>
        </div>
      </>
    );
  }

  // ===== Index view (no template active) — original markup preserved. =====
  return (
    <AppShell wide>
      <ScreenHeader
        screen="journal"
        title="Journal"
        subtitle="Spara dagen som den var."
        topLeft={
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="inline-flex items-center gap-1 text-sm font-bold text-foreground/80 press-soft"
          >
            <ChevronLeft size={18} /> Tillbaka
          </button>
        }
      />

      <h2 className="text-lg font-extrabold mb-3">Mallar</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {(Object.keys(TEMPLATES) as TemplateKey[]).map((k, i) => {
          const t = TEMPLATES[k];
          const onYellow = t.text === "text-foreground";
          const plusBg = onYellow ? "bg-foreground/10 text-foreground" : "bg-white/25 text-white";
          return (
            <button
              key={k}
              onClick={() => startTemplate(k)}
              className={`relative overflow-hidden w-full text-left rounded-3xl ${t.bg} ${t.text} p-4 shadow-card press-soft animate-pop-in flex flex-col justify-between min-h-[148px]`}
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <span aria-hidden className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-foreground/10 pointer-events-none" />
              <span aria-hidden className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className={`relative z-[1] w-9 h-9 rounded-full grid place-items-center ${plusBg}`}>
                <Plus size={18} strokeWidth={2.6} />
              </div>
              <div className="relative z-[1]">
                <div className="text-[18px] font-extrabold leading-tight">{t.title}</div>
                <div className="text-[12px] opacity-90 mt-1 leading-snug">{t.subtitle}</div>
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
        <ul className="space-y-4">
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
