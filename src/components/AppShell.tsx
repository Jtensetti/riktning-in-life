import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto px-6 pt-8 safe-bottom animate-fade-up">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
