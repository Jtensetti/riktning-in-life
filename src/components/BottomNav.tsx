import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { ActivityPicker, type ActivityDraft } from "./ActivityPicker";
import { toast } from "sonner";

type Tab = { to: string; label: string; icon: IconName; activeColor: string };

const leftTabs: Tab[] = [
  { to: "/", label: "Idag", icon: "house-soft", activeColor: "hsl(var(--orange-start))" },
  { to: "/utforska", label: "Utforska", icon: "spark", activeColor: "hsl(var(--pink-move))" },
];

const rightTabs: Tab[] = [
  { to: "/insikter", label: "Insikter", icon: "pie", activeColor: "hsl(var(--green-recovery))" },
  { to: "/vard", label: "Vård", icon: "stethoscope", activeColor: "hsl(var(--blue-calm))" },
];

export const BottomNav = () => {
  const { user } = useAuth();
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
    });
    if (error) {
      toast.error("Kunde inte logga. Försök igen.");
      return;
    }
    toast.success(`${a.label} loggad`);
  };

  const renderTab = ({ to, label, icon, activeColor }: Tab) => (
    <li key={to} className="flex-1">
      <NavLink
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 h-full transition-colors ${
            isActive ? "text-foreground" : "text-text-secondary"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`grid place-items-center w-10 h-10 rounded-full transition-all duration-200 ${
                isActive ? "animate-pop-in" : ""
              }`}
              style={{
                background: isActive ? `${activeColor.replace("hsl(", "hsla(").replace(")", " / 0.18)")}` : "transparent",
              }}
            >
              <AbstractIcon
                name={icon}
                size={isActive ? 24 : 22}
                color={isActive ? activeColor : "hsl(var(--text-secondary))"}
                inline
              />
            </span>
            <span className={`text-[11px] ${isActive ? "font-extrabold" : "font-semibold"}`}>{label}</span>
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
        <ul className="flex items-stretch justify-around h-[76px] max-w-md mx-auto px-2 relative">
          {leftTabs.map(renderTab)}

          {/* Center FAB slot */}
          <li className="flex-1 flex items-start justify-center">
            <button
              onClick={() => setPickerOpen(true)}
              aria-label="Logga aktivitet"
              className="relative -translate-y-4 grid place-items-center w-[58px] h-[58px] rounded-full bg-orange-start text-white shadow-soft press-soft active:scale-95 transition-transform ring-4 ring-surface"
            >
              <Plus size={26} strokeWidth={2.6} />
              <span className="absolute -bottom-5 text-[11px] font-extrabold text-text-secondary whitespace-nowrap">Logga</span>
            </button>
          </li>

          {rightTabs.map(renderTab)}
        </ul>
      </nav>
      <ActivityPicker open={pickerOpen} onOpenChange={setPickerOpen} onAdd={handleAdd} />
    </>
  );
};
