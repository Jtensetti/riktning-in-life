import { useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { ActivityPicker, type ActivityDraft } from "./ActivityPicker";
import { toast } from "sonner";

/**
 * Bottom navigation — locked specs (per design contract):
 *   nav height       82px + safe-area
 *   center FAB       68px circle, #FF6B1A, shadow 0 8px 24px rgba(255,107,26,0.35)
 *   nav icon size    24px
 *   label            12–13px, weight 800
 *   inactive color   #746E68 (--nav-inactive)
 *   active color     follows tab identity (from screenIdentity)
 *
 * The five tabs are deliberate: Idag, Utforska, Logga (FAB), Insikter, Vård.
 * Journal lives inside Utforska as a prominent ActionCard (per plan).
 *
 * The FAB is contextual: on Idag it opens the day check-in if missing,
 * otherwise the ActivityPicker. On every other tab it opens the picker.
 */

type Tab = {
  to: string;
  label: string;
  icon: IconName;
  /** CSS color for active state (from --orange-start, --pink-move, etc.) */
  activeColor: string;
};

const leftTabs: Tab[] = [
  { to: "/", label: "Idag", icon: "house-soft", activeColor: "hsl(var(--orange-start))" },
  { to: "/utforska", label: "Utforska", icon: "spark", activeColor: "hsl(var(--pink-move))" },
];

const rightTabs: Tab[] = [
  { to: "/insikter", label: "Insikter", icon: "pie", activeColor: "hsl(var(--green-recovery))" },
  { to: "/vard", label: "Vård", icon: "stethoscope", activeColor: "hsl(var(--blue-calm))" },
];

const NAV_INACTIVE = "hsl(var(--nav-inactive))";

export const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAdd = async (a: ActivityDraft) => {
    if (!user) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      activity_slug: a.slug,
      label: a.label,
      category: a.category,
      icon: a.icon,
      color: a.color,
      duration_minutes: a.duration_minutes,
      mood_delta: a.mood_delta,
      semantic_kind: a.semantic_kind ?? null,
      intensity: a.intensity ?? null,
      with_who: a.with_who ?? null,
    } as any);
    if (error) {
      toast.error("Kunde inte logga. Försök igen.");
      return;
    }
    toast.success(`${a.label} loggad`);
  };

  /**
   * Contextual FAB behaviour:
   * - On /  (Idag): if today has no check-in, open check-in. Else open picker.
   *   (We avoid a DB roundtrip in the common case by reading the cheap
   *   sessionStorage flag set by Today after a successful check-in.)
   * - On every other tab: always open the picker.
   */
  const onFabClick = () => {
    const onToday = location.pathname === "/";
    if (onToday) {
      const today = new Date().toISOString().split("T")[0];
      const lastCheckin = typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("riktning:lastCheckinDate")
        : null;
      if (lastCheckin !== today) {
        navigate("/checkin");
        return;
      }
    }
    setPickerOpen(true);
  };

  const renderTab = ({ to, label, icon, activeColor }: Tab) => (
    <li key={to} className="flex-1">
      <NavLink
        to={to}
        end={to === "/"}
        className="flex flex-col items-center justify-center gap-1 h-full"
      >
        {({ isActive }) => (
          <>
            <AbstractIcon
              name={icon}
              size={24}
              color={isActive ? activeColor : NAV_INACTIVE}
              inline
            />
            <span
              className="text-[12px] font-extrabold transition-colors"
              style={{ color: isActive ? activeColor : NAV_INACTIVE }}
            >
              {label}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border-soft"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul
          className="flex items-stretch justify-around max-w-md mx-auto px-2 relative"
          style={{ height: "82px" }}
        >
          {leftTabs.map(renderTab)}

          {/* Center FAB slot */}
          <li className="flex-1 flex items-start justify-center">
            <button
              onClick={onFabClick}
              aria-label="Logga aktivitet"
              className="relative -translate-y-5 grid place-items-center rounded-full text-white press-soft active:scale-95 transition-transform ring-4 ring-surface"
              style={{
                width: "var(--fab-size)",
                height: "var(--fab-size)",
                background: "hsl(var(--orange-start))",
                boxShadow: "var(--fab-shadow)",
              }}
            >
              <Plus size={28} strokeWidth={2.6} />
              <span
                className="absolute -bottom-5 text-[12px] font-extrabold whitespace-nowrap"
                style={{ color: NAV_INACTIVE }}
              >
                Logga
              </span>
            </button>
          </li>

          {rightTabs.map(renderTab)}
        </ul>
      </nav>
      <ActivityPicker open={pickerOpen} onOpenChange={setPickerOpen} onAdd={handleAdd} />
    </>
  );
};
