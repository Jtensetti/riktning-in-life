import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Illustration } from "@/components/Illustrations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

type TemplateKey = "three_lines" | "thought_loop" | "body_first" | "evidence" | "free";

const TEMPLATES: Record<TemplateKey, { title: string; subtitle: string; color: string; ill: "journal" | "thoughtLoop" | "bodyScan" | "focus"; fields: { key: string; label: string; placeholder?: string }[] }> = {
  three_lines: {
    title: "Tre rader",
    subtitle: "En liten avstamp för dagen",
    color: "bg-yellow-journal",
    ill: "journal",
    fields: [
      { key: "heaviest", label: "Det tyngsta idag var" },
      { key: "helped", label: "Något som hjälpte lite var" },
      { key: "tomorrow", label: "Imorgon behöver jag" },
    ],
  },
  thought_loop: {
    title: "Tankeloop",
    subtitle: "Fakta vs tolkning",
    color: "bg-orange-start",
    ill: "thoughtLoop",
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
    color: "bg-blue-calm",
    ill: "bodyScan",
    fields: [
      { key: "where", label: "Var sitter känslan?" },
      { key: "signal", label: "Vad signalerar kroppen?" },
      { key: "release", label: "Vad kan minska trycket 5 %?" },
    ],
  },
  evidence: {
    title: "Bevislogg",
    subtitle: "Vad gjorde du trots motstånd?",
    color: "bg-green-recovery",
    ill: "focus",
    fields: [
      { key: "did", label: "Vad gjorde jag trots motstånd?" },
      { key: "means", label: "Vad säger det som depressionen inte säger?" },
      { key: "remember", label: "Vad vill jag minnas?" },
    ],
  },
  free: {
    title: "Fri text",
    subtitle: "Skriv vad du vill",
    color: "bg-pink-move",
    ill: "journal",
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
        <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4">
          <ChevronLeft size={18} /> Tillbaka
        </button>
        <div className={`rounded-3xl ${t.color} p-1 mb-6 overflow-hidden shadow-soft`}>
          <div className="rounded-[20px] overflow-hidden">
            <Illustration name={t.ill} className="w-full h-auto" />
          </div>
          <div className="px-4 pb-4 pt-3 text-white">
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
            t.fields.map(f => (
              <div key={f.key}>
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
          className="w-full h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px]"
        >
          {saving ? "Sparar…" : "Spara"}
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Journal</h1>
        <p className="text-sm text-text-secondary">Spara dagen som den var.</p>
      </header>

      <h2 className="text-lg font-extrabold mb-3">Mallar</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {(Object.keys(TEMPLATES) as TemplateKey[]).map(k => {
          const t = TEMPLATES[k];
          return (
            <button
              key={k}
              onClick={() => startTemplate(k)}
              className={`text-left rounded-3xl ${t.color} text-white p-4 h-32 shadow-soft hover:opacity-95 transition flex flex-col justify-between`}
            >
              <Plus size={18} className="opacity-80" />
              <div>
                <div className="text-[17px] font-extrabold leading-tight">{t.title}</div>
                <div className="text-[12px] opacity-90 mt-0.5">{t.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="text-lg font-extrabold mb-3">Historik</h2>
      {entries.length === 0 ? (
        <div className="card-cream p-6 text-center">
          <BookOpen size={28} className="mx-auto mb-2 text-text-secondary" />
          <p className="text-sm text-text-secondary">Inga anteckningar än. Börja med Tre rader.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map(e => {
            const t = TEMPLATES[e.template_type as TemplateKey];
            const preview = e.free_text ?? Object.values(e.body_json ?? {}).filter(Boolean).join(" · ");
            return (
              <li key={e.id} className="card-soft p-4 flex gap-3 items-start">
                <div className={`w-2 self-stretch rounded-full ${t?.color ?? "bg-surface-alt"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[15px] font-extrabold truncate">{e.title || t?.title || "Anteckning"}</span>
                    <span className="text-[11px] font-semibold text-text-secondary shrink-0">
                      {new Date(e.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {preview && <p className="text-sm text-text-secondary line-clamp-2">{preview}</p>}
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
