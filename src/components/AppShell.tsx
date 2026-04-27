import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./desktop/SideNav";
import { DesktopTopbar } from "./desktop/DesktopTopbar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell — wraps every "regular" page (not Auth/Onboarding/wizards).
 *
 * On mobile (< lg): unchanged from before.
 *   - Cream background, max-w-md centered <main>, fixed BottomNav.
 *
 * On desktop (>= lg): introduces a 3-zone layout:
 *   - Top: thin DesktopTopbar (56px) with wordmark + sign-out.
 *   - Left: SideNav (240px sticky) replaces BottomNav (which is hidden).
 *   - Right: the page content. Pages choose their own width:
 *       * "Calm stream" pages keep <main className="max-w-md mx-auto …">,
 *         which on desktop becomes a centered 448px column with cream
 *         space around it (a focused reading surface).
 *       * "Workspace" pages internally use <WideLayout left right>
 *         to lay out their own sections side-by-side up to ~1100px.
 *
 * The mobile DOM is preserved exactly — the desktop chrome only renders
 * on `lg:` so under that breakpoint nothing visible changes.
 */
export const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <DesktopTopbar />
      <div className="lg:flex lg:items-start">
        <SideNav />
        <main
          key={location.pathname}
          className="max-w-md mx-auto px-6 pt-5 safe-bottom animate-fade-in-up lg:max-w-none lg:flex-1 lg:px-12 lg:pt-10 lg:min-w-0"
        >
          {/* Inner constraint preserves the mobile reading column on desktop
              for pages that don't opt into a wide layout. Pages that DO opt
              in (via WideLayout) explicitly stretch beyond this. */}
          <div className="lg:max-w-[1100px] lg:mx-auto">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
