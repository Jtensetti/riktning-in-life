import { NavLink } from "react-router-dom";
import { Home, Sparkles, BarChart3, BookOpen, Stethoscope } from "lucide-react";

const tabs = [
  { to: "/", label: "Idag", Icon: Home },
  { to: "/ovningar", label: "Övningar", Icon: Sparkles },
  { to: "/vecka", label: "Vecka", Icon: BarChart3 },
  { to: "/journal", label: "Journal", Icon: BookOpen },
  { to: "/vard", label: "Vård", Icon: Stethoscope },
];

export const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border-soft"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-[76px] max-w-md mx-auto px-2">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 h-full rounded-2xl transition-colors ${
                  isActive ? "text-foreground" : "text-text-secondary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="transition-transform"
                    size={24}
                    strokeWidth={isActive ? 2.6 : 2.2}
                    style={{ transform: isActive ? "translateY(-1px)" : undefined }}
                  />
                  <span className={`text-[11px] ${isActive ? "font-extrabold" : "font-semibold"}`}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
