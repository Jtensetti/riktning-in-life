import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./desktop/SideNav";
import { DesktopTopbar } from "./desktop/DesktopTopbar";

interface AppShellProps {
  children: ReactNode;
  /**
   * On desktop (≥lg), opt this page out of the centered 448px column and
   * give it the full ~1100px content area. Use this for pages that lay
   * their own sections out side-by-side (Insikter, Vård, Utforska, etc.).
   *
   * Mobile is unaffected by this prop — the column is always max-w-md
   * on small screens.
   */
  wide?: boolean;
}

/**
 * AppShell — wraps every "regular" page (not Auth/Onboarding/wizards).
 *
 * On mobile (< lg): unchanged from before.
 *   - Cream background, max-w-md centered <main>, fixed BottomNav.
 *
 * On desktop (≥ lg): introduces a 3-zone layout:
 *   - Top: thin DesktopTopbar (56px) with wordmark + sign-out.
 *   - Left: SideNav (240px sticky) replaces BottomNav (which hides).
 *   - Right: the page content. Two modes:
 *       * Default (calm stream): keeps the 448px column centered in the
 *         remaining space. Cream around it. Used for Today, Krisplan,
 *         readers, wizards — focused single-column reading.
 *       * `wide`: opens up to ~1100px for "workspace" pages that arrange
 *         their own sections in a two-column grid via <WideLayout>.
 *
 * The mobile DOM is preserved exactly — desktop chrome only renders
 * on `lg:` so under that breakpoint nothing visible changes.
 */
export const AppShell = ({ children, wide = false }: AppShellProps) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <DesktopTopbar />
      <div className="lg:flex lg:items-start">
        <SideNav />
        <main
          key={location.pathname}
          className={[
            "px-6 pt-5 safe-bottom animate-fade-in-up mx-auto",
            // Mobile (default): tight 448px column, exactly as before.
            "max-w-md",
            // Desktop calm stream: open the column to ~560px for readability.
            "lg:max-w-[560px]",
            // Desktop layout: take the remaining flex space + add room.
            "lg:flex-1 lg:min-w-0 lg:pt-10 lg:px-10",
            // Wide pages override the calm-stream cap on desktop only.
            wide ? "lg:!max-w-[1180px]" : "",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
