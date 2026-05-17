import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Plus,
  Home,
  Compass,
  LineChart,
  BarChart3,
  Stethoscope,
  Zap,
  ShieldAlert,
  Settings as SettingsIcon,
  Moon,
  Activity,
  SmilePlus,
  Pill,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { ActivityPicker, type ActivityDraft } from "@/components/ActivityPicker";
import { insertActivityLog } from "@/lib/activityLog";
import { useAuth } from "@/hooks/useAuth";

/**
 * SideNav — desktop-only (≥lg). Mobil använder BottomNav.
 *
 * Bytte från AbstractIcon-stickers till lucide line-icons + sektionsfärgad
 * brickbakgrund. Stickrarna är fina på mobil men lästes inte semantiskt på
 * desktop — line-iconer + färgkod är mycket tydligare i en sidonav.
 */

type Item = {
  to: string;
  label: string;
  Icon: LucideIcon;
  activeColor: string;
};

const PRIMARY: Item[] = [
  { to: "/", label: "Idag", Icon: Home, activeColor: "hsl(var(--orange-start))" },
  { to: "/utforska", label: "Utforska", Icon: Compass, activeColor: "hsl(var(--pink-move))" },
];

const PRIMARY_AFTER: Item[] = [
  { to: "/insikter", label: "Insikter", Icon: LineChart, activeColor: "hsl(var(--green-recovery))" },
  { to: "/analys", label: "Analys", Icon: BarChart3, activeColor: "hsl(var(--purple-sleep))" },
  { to: "/vard", label: "Vård", Icon: Stethoscope, activeColor: "hsl(var(--blue-calm))" },
];

const SECONDARY: Item[] = [
  { to: "/snabblogg", label: "Snabblogg", Icon: Zap, activeColor: "hsl(var(--orange-start))" },
  { to: "/krisplan", label: "Krisplan", Icon: ShieldAlert, activeColor: "hsl(var(--red-risk))" },
  { to: "/installningar", label: "Inställningar", Icon: SettingsIcon, activeColor: "hsl(var(--foreground))" },
];

type QuickChip = {
  key: "sleep" | "movement" | "mood" | "medication";
  label: string;
  Icon: LucideIcon;
  color: string;
};

const QUICK_CHIPS: QuickChip[] = [
  { key: "sleep", label: "Sömn", Icon: Moon, color: "hsl(var(--purple-sleep))" },
  { key: "movement", label: "Kropp", Icon: Activity, color: "hsl(var(--pink-move))" },
  { key: "mood", label: "Mående", Icon: SmilePlus, color: "hsl(var(--orange-start))" },
  { key: "medication", label: "Medicin", Icon: Pill, color: "hsl(var(--blue-calm))" },
];

export const SideNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAdd = async (a: ActivityDraft) => {
    if (!user) return;
    await insertActivityLog(user.id, a);
  };

  /**
   * En rad i sidonaven. Active state:
   *  - 3px vänsterstreck i sektionsfärg
   *  - färgad brick bakom ikonen (sektionsfärg @ 14%)
   *  - ikonen själv tintad i sektionsfärgen
   *  - texten extrabold i sektionsfärgen
   */
  const renderItem = (item: Item) => {
    const { Icon } = item;
    return (
      <li key={item.to} className="relative">
        <NavLink
          to={item.to}
          end={item.to === "/"}
          className="group flex items-center gap-3 pl-4 pr-3 h-12 rounded-2xl press-soft transition-colors hover:bg-surface-alt/60"
        >
          {({ isActive }) => (
            <>
              <span
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-opacity"
                style={{
                  background: item.activeColor,
                  opacity: isActive ? 1 : 0,
                }}
                aria-hidden
              />
              <span
                className="shrink-0 grid place-items-center rounded-xl transition-colors"
                style={{
                  width: 36,
                  height: 36,
                  background: isActive
                    ? item.activeColor.replace("hsl(", "hsla(").replace(")", ", 0.14)")
                    : "hsl(var(--surface-alt) / 0.5)",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  style={{
                    color: isActive ? item.activeColor : "hsl(var(--text-secondary))",
                  }}
                />
              </span>
              <span
                className="text-[15px] transition-colors"
                style={{
                  color: isActive ? item.activeColor : "hsl(var(--foreground))",
                  fontWeight: isActive ? 800 : 700,
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      <aside
        className="hidden lg:flex flex-col shrink-0 border-r border-border-soft bg-background"
        style={{ width: 272, height: "calc(100vh - 64px)", position: "sticky", top: 64 }}
      >
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-1 relative">
            {PRIMARY.map(renderItem)}

            {/* Snabblogg-chips — semantiska ikoner i tonade brickor. */}
            <li className="pt-5 pb-2">
              <div className="px-1 mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">
                Snabblogg
              </div>
              <div className="grid grid-cols-4 gap-2 px-1">
                {QUICK_CHIPS.map(c => {
                  const { Icon } = c;
                  const bg = c.color.replace("hsl(", "hsla(").replace(")", ", 0.14)");
                  return (
                    <button
                      key={c.key}
                      onClick={() => navigate(`/snabblogg?open=${c.key}`)}
                      title={c.label}
                      aria-label={c.label}
                      className="aspect-square rounded-2xl grid place-items-center press-soft transition-all hover:scale-105 border border-transparent hover:border-border-soft"
                      style={{ background: bg }}
                    >
                      <Icon size={22} strokeWidth={2.2} style={{ color: c.color }} />
                    </button>
                  );
                })}
              </div>
            </li>

            {/* Logga aktivitet — primär CTA. */}
            <li className="py-2">
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center gap-3 px-4 h-12 rounded-2xl press-soft transition-transform active:scale-[0.98] text-white"
                style={{
                  background: "hsl(var(--orange-start))",
                  boxShadow: "0 4px 14px hsl(var(--orange-start) / 0.35)",
                }}
              >
                <Plus size={22} strokeWidth={2.6} />
                <span className="text-[15px] font-extrabold">Logga aktivitet</span>
              </button>
            </li>

            {/* Skriv i journalen — sekundär CTA. */}
            <li className="py-1.5">
              <button
                onClick={() => navigate("/journal")}
                className="w-full flex items-center gap-3 px-4 h-12 rounded-2xl press-soft transition-transform active:scale-[0.98]"
                style={{
                  background: "hsl(var(--yellow-journal))",
                  color: "hsl(var(--foreground))",
                }}
              >
                <Pencil size={20} strokeWidth={2.4} style={{ color: "hsl(var(--orange-start))" }} />
                <span className="text-[15px] font-extrabold">Skriv i journalen</span>
              </button>
            </li>

            {PRIMARY_AFTER.map(renderItem)}

            <li className="py-3">
              <hr className="border-border-soft" />
            </li>

            {SECONDARY.map(renderItem)}
          </ul>
        </nav>
      </aside>
      <ActivityPicker open={pickerOpen} onOpenChange={setPickerOpen} onAdd={handleAdd} />
    </>
  );
};
