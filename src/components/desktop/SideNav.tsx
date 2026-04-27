import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { ActivityPicker, type ActivityDraft } from "@/components/ActivityPicker";
import { insertActivityLog } from "@/lib/activityLog";
import { useAuth } from "@/hooks/useAuth";

/**
 * SideNav — desktop-only side navigation (≥lg). Mobile uses BottomNav.
 *
 * Desktop hierarchy mirrors mobile's intent but with two primary CTAs:
 *  - "Logga aktivitet" → samma ActivityPicker som mobilens FAB öppnar.
 *  - "Skriv i journalen" → desktopens längre, tangentbordsdrivna flöde.
 *
 * Snabbloggning behålls som en kompakt chip-rad. Analys läggs på topp-nivå
 * så att desktopanvändaren inte behöver gräva sig dit via Insikter.
 */

type Item = {
  to: string;
  label: string;
  icon: IconName;
  activeColor: string;
};

const PRIMARY: Item[] = [
  { to: "/", label: "Idag", icon: "house-soft", activeColor: "hsl(var(--orange-start))" },
  { to: "/utforska", label: "Utforska", icon: "spark", activeColor: "hsl(var(--pink-move))" },
];

const PRIMARY_AFTER: Item[] = [
  { to: "/insikter", label: "Insikter", icon: "pie", activeColor: "hsl(var(--green-recovery))" },
  { to: "/analys", label: "Analys", icon: "pie", activeColor: "hsl(var(--purple-sleep))" },
  { to: "/vard", label: "Vård", icon: "stethoscope", activeColor: "hsl(var(--blue-calm))" },
];

const SECONDARY: Item[] = [
  { to: "/snabblogg", label: "Snabblogg", icon: "blob-smile", activeColor: "hsl(var(--orange-start))" },
  { to: "/krisplan", label: "Krisplan", icon: "shield-soft", activeColor: "hsl(var(--red-risk))" },
  { to: "/installningar", label: "Inställningar", icon: "book-open", activeColor: "hsl(var(--foreground))" },
];

type QuickChip = {
  key: "sleep" | "movement" | "mood" | "medication";
  label: string;
  icon: IconName;
  color: string;
};

const QUICK_CHIPS: QuickChip[] = [
  { key: "sleep", label: "Sömn", icon: "bed-soft", color: "hsl(var(--purple-sleep))" },
  { key: "movement", label: "Kropp", icon: "walk-figure", color: "hsl(var(--pink-move))" },
  { key: "mood", label: "Mående", icon: "blob-smile", color: "hsl(var(--orange-start))" },
  { key: "medication", label: "Medicin", icon: "pill", color: "hsl(var(--blue-calm))" },
];

const NAV_INACTIVE = "hsl(var(--nav-inactive))";

export const SideNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAdd = async (a: ActivityDraft) => {
    if (!user) return;
    await insertActivityLog(user.id, a);
  };

  const renderItem = (item: Item) => (
    <li key={item.to} className="relative">
      <NavLink
        to={item.to}
        end={item.to === "/"}
        className="group flex items-center gap-3 px-3 h-12 rounded-2xl press-soft transition-colors hover:bg-surface-alt/60"
      >
        {({ isActive }) => (
          <>
            <span
              className="absolute left-0 w-1 rounded-r-full transition-all"
              style={{
                height: isActive ? 28 : 0,
                background: item.activeColor,
              }}
              aria-hidden
            />
            <AbstractIcon
              name={item.icon}
              size={26}
              color={isActive ? item.activeColor : NAV_INACTIVE}
              inline
            />
            <span
              className="text-[15px] font-extrabold transition-colors"
              style={{ color: isActive ? item.activeColor : "hsl(var(--foreground))" }}
            >
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );

  return (
    <>
      <aside
        className="hidden lg:flex flex-col shrink-0 border-r border-border-soft bg-background"
        style={{ width: 272, height: "calc(100vh - 64px)", position: "sticky", top: 64 }}
      >
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-1 relative">
            {PRIMARY.map(renderItem)}

            {/* Snabblogg-chips — sekundär snabblogg på desktop. */}
            <li className="pt-5 pb-2">
              <div className="px-1 mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">
                Snabblogg
              </div>
              <div className="grid grid-cols-4 gap-2 px-1">
                {QUICK_CHIPS.map(c => (
                  <button
                    key={c.key}
                    onClick={() => navigate(`/snabblogg?open=${c.key}`)}
                    title={c.label}
                    aria-label={c.label}
                    className="aspect-square rounded-2xl bg-surface hover:bg-surface-alt grid place-items-center press-soft transition-colors"
                  >
                    <AbstractIcon name={c.icon} size={24} color={c.color} inline />
                  </button>
                ))}
              </div>
            </li>

            {/* Logga aktivitet — desktop-parity för mobilens FAB. */}
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

            {/* Skriv i journalen — desktopens andra primära CTA. */}
            <li className="py-1.5">
              <button
                onClick={() => navigate("/journal")}
                className="w-full flex items-center gap-3 px-4 h-14 rounded-2xl press-soft transition-transform active:scale-[0.98]"
                style={{
                  background: "hsl(var(--yellow-journal))",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 14px hsl(var(--yellow-journal) / 0.45)",
                }}
              >
                <AbstractIcon name="pencil-soft" size={24} color="hsl(var(--orange-start))" inline />
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
