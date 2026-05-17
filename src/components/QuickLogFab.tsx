import { Plus } from "lucide-react";

interface Props {
  onClick: () => void;
}

/** Floating action button — fäst ovanför BottomNav, alltid nåbar för snabbloggning. */
export const QuickLogFab = ({ onClick }: Props) => (
  <button
    onClick={onClick}
    aria-label="Logga aktivitet"
    className="fixed z-30 right-5 grid place-items-center w-14 h-14 rounded-full bg-orange-start text-white shadow-soft press-soft animate-pop-in active:scale-95 transition-transform lg:hidden"
    style={{ bottom: "calc(76px + env(safe-area-inset-bottom) + 16px)" }}
  >
    <Plus size={26} strokeWidth={2.6} />
  </button>
);
