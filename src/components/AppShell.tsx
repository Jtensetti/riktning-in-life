import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      {/* `key` re-runs the fade-in animation on route change */}
      <main key={location.pathname} className="max-w-md mx-auto px-6 pt-5 safe-bottom animate-fade-in-up">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
