import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./desktop/SideNav";
import { DesktopTopbar } from "./desktop/DesktopTopbar";
import { CommandPalette } from "./desktop/CommandPalette";

interface AppShellProps {
  children: ReactNode;
  /**
   * Bredd-läge på desktop. Mobil är alltid max-w-md (oförändrad).
   *  - "dashboard" (default): fyller upp till 1440px, byggt för 2–3-kolumns
   *    arbetsytor (Today, Insikter, Vård, Utforska, Snabblogg).
   *  - "reader": cappar till 760px centrerat — för enkolumns-läsning
   *    (LearnArticle, Krisplan, wizards).
   */
  density?: "dashboard" | "reader";
  /** @deprecated Bakåtkompatibilitet — alla sidor är "dashboard" på desktop. */
  wide?: boolean;
}

/**
 * AppShell — gemensam rampe för alla "normala" sidor (ej Auth/Onboarding).
 *
 * Mobil (<lg): cream-bakgrund, 448px centrerad <main>, fix BottomNav.
 *   → DETTA SKA INTE ÄNDRAS. Allt mobiltestat är fryst.
 *
 * Desktop (≥lg): 3 zoner — DesktopTopbar + SideNav (272px sticky) + main.
 *   - density="dashboard" (default): main upp till 1440px, fyller resten
 *     av skärmen bredvid SideNav. Det är detta läge som låter Today/
 *     Insikter/Vård lägga ut sina egna 2–3-kolumns-rutnät utan tomrum.
 *   - density="reader": cappar 760px centrerat — sidor som är
 *     "en lång läs-tråd" (LearnArticle, Krisplan, wizards).
 */
export const AppShell = ({ children, density = "dashboard", wide }: AppShellProps) => {
  const location = useLocation();
  // Backwards compat: wide=true motsvarar nya defaulten dashboard,
  // wide=false betyder ingenting längre (vi använder aldrig 560px-cap).
  void wide;
  const isReader = density === "reader";
  return (
    <div className="min-h-screen bg-background">
      <DesktopTopbar />
      <div className="lg:flex lg:items-start">
        <SideNav />
        <main
          key={location.pathname}
          className={[
            "px-6 pt-5 safe-bottom animate-fade-in-up mx-auto",
            // Mobil: 448px column — oförändrat.
            "max-w-md",
            // Desktop: tar resten av flex-raden, generös top-padding.
            "lg:flex-1 lg:min-w-0 lg:pt-8 lg:px-8",
            // Dashboard fyller upp till 1440px (vi har 1575+ px att jobba med);
            // reader cappar 760px för långform.
            isReader ? "lg:!max-w-[760px]" : "lg:!max-w-[1440px]",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
      <BottomNav />
      <CommandPalette />
    </div>
  );
};
