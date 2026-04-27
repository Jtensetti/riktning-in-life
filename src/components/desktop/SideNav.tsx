import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { ActivityPicker, type ActivityDraft } from "@/components/ActivityPicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * SideNav — desktop-only side navigation (≥lg). Mobile uses BottomNav.
 *
 * Layout: 240px wide, full height, cream background, thin right border.
 * Three groups, separated by hairlines:
 *  1. Primary tabs (Idag, Utforska, Logga, Insikter, Vård) — same five as
 *     bottom-nav. The Logga row is a colored button (orange) instead of a tab,
 *     opening the same ActivityPicker the FAB does on mobile.
 *  2. Secondary destinations (Journal, Krisplan, Inställningar) — moved out
 *     of "Mer" into top-level visibility, since desktop has the room.
 *
 * Uses the same screenIdentity color tokens as the bottom-nav so the visual
 * vocabulary matches across breakpoints.
 */

type Item = {
  to: string;
  label: string;
  icon: IconName;
  /** Active text color (CSS hsl). */
  activeColor: string;
};

const PRIMARY: Item[] = [
  { to: "/", label: "Idag", icon: "house-soft", activeColor: "hsl(var(--orange-start))" },
  { to: "/utforska", label: "Utforska", icon: "spark", activeColor: "hsl(var(--pink-move))" },
];

const PRIMARY_AFTER: Item[] = [
  { to: "/insikter", label: "Insikter", icon: "pie", activeColor: "hsl(var(--green-recovery))" },
  { to: "/vard", label: "Vård", icon: "stethoscope", activeColor: "hsl(var(--blue-calm))" },
];

const SECONDARY: Item[] = [
  { to: "/journal", label: "Journal", icon: "pencil-soft", activeColor: "hsl(var(--yellow-journal))" },
  { to: "/krisplan", label: "Krisplan", icon: "shield-soft", activeColor: "hsl(var(--red-risk))" },
  { to: "/installningar", label: "Inställningar", icon: "book-open", activeColor: "hsl(var(--foreground))" },
];

const NAV_INACTIVE = "hsl(var(--nav-inactive))";

export const SideNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAdd = async (draft: ActivityDraft) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      title: draft.title,
      duration_minutes: draft.duration_minutes,
      semantic_kind: draft.semantic_kind,
      sleep_quality: draft.sleep_quality ?? null,
      location: draft.location ?? null,
    } as never);
    if (error) {
      toast.error("Kunde inte spara");
      return;
    }
    toast.success("Loggat");
  };

  const renderItem = (item: Item) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.to === "/"}
        className="group flex items-center gap-3 px-3 h-11 rounded-2xl press-soft transition-colors"
      >
        {({ isActive }) => (
          <>
            <span
              className="absolute left-0 w-1 rounded-r-full transition-all"
              style={{
                height: isActive ? 24 : 0,
                background: item.activeColor,
              }}
              aria-hidden
            />
            <AbstractIcon
              name={item.icon}
              size={22}
              color={isActive ? item.activeColor : NAV_INACTIVE}
              inline
            />
            <span
              className="text-[14px] font-extrabold transition-colors"
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
        style={{ width: 240, height: "calc(100vh - 56px)", position: "sticky", top: 56 }}
      >
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-1 relative">
            {PRIMARY.map(renderItem)}

            {/* Logga — central CTA, not a tab. Same picker as mobile FAB. */}
            <li className="py-2">
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center gap-3 px-3 h-12 rounded-2xl press-soft transition-transform active:scale-[0.98]"
                style={{
                  background: "hsl(var(--orange-start))",
                  color: "white",
                  boxShadow: "0 4px 14px hsl(19 100% 55% / 0.30)",
                }}
              >
                <Plus size={20} strokeWidth={2.6} />
                <span className="text-[14px] font-extrabold">Logga aktivitet</span>
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
