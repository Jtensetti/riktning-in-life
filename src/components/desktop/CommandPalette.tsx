import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Compass, LineChart, BarChart3, Stethoscope, Zap, ShieldAlert,
  Settings as SettingsIcon, Pencil, BookOpen, FileText, NotebookText,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

/**
 * CommandPalette — desktop ⌘K / Ctrl+K snabbnavigering + handlingar.
 *
 * Mobil använder BottomNav + FAB — palette monteras bara på lg+ via AppShell.
 * Tangentbordsgenvägar: ⌘K öppnar, ⌘N öppnar check-in, ⌘L öppnar snabblogg.
 */
export const CommandPalette = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const t = e.target as HTMLElement | null;
      const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (!inField && e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate("/checkin");
      } else if (!inField && e.key.toLowerCase() === "l") {
        e.preventDefault();
        navigate("/snabblogg");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Sök sida eller handling…" />
      <CommandList>
        <CommandEmpty>Inget matchar.</CommandEmpty>
        <CommandGroup heading="Handlingar">
          <CommandItem onSelect={() => go("/checkin")}>
            <Pencil /> <span>Gör dagens check-in</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/snabblogg")}>
            <Zap /> <span>Öppna snabblogg</span>
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/journal")}>
            <NotebookText /> <span>Skriv i journalen</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/vard/rapport")}>
            <FileText /> <span>Skapa vårdrapport</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Gå till">
          <CommandItem onSelect={() => go("/")}>
            <Home /> <span>Idag</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/utforska")}>
            <Compass /> <span>Utforska</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/insikter")}>
            <LineChart /> <span>Insikter</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/analys")}>
            <BarChart3 /> <span>Analys</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/vard")}>
            <Stethoscope /> <span>Vård</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/lar-dig")}>
            <BookOpen /> <span>Lär dig</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/krisplan")}>
            <ShieldAlert /> <span>Krisplan</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/installningar")}>
            <SettingsIcon /> <span>Inställningar</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
