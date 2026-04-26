import { NavLink } from "react-router-dom";
import { AbstractIcon, type IconName } from "./AbstractIcon";

const tabs: { to: string; label: string; icon: IconName; activeColor: string }[] = [
  { to: "/", label: "Idag", icon: "house-soft", activeColor: "hsl(var(--orange-start))" },
  { to: "/snabblogg", label: "Logga", icon: "spark", activeColor: "hsl(var(--pink-move))" },
  { to: "/vecka", label: "Vecka", icon: "pie", activeColor: "hsl(var(--green-recovery))" },
  { to: "/journal", label: "Journal", icon: "pencil-soft", activeColor: "hsl(var(--yellow-journal))" },
  { to: "/vard", label: "Vård", icon: "heart-pulse", activeColor: "hsl(var(--blue-calm))" },
];

export const BottomNav = () => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border-soft"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-[76px] max-w-md mx-auto px-2">
        {tabs.map(({ to, label, icon, activeColor }) => (
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
                      background: isActive ? `${activeColor.replace("hsl(", "hsla(").replace(")", " / 0.14)")}` : "transparent",
                    }}
                  >
                    <AbstractIcon
                      name={icon}
                      size={22}
                      color={isActive ? activeColor : "hsl(var(--text-secondary))"}
                    />
                  </span>
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
