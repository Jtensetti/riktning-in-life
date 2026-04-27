import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * DesktopTopbar — slim 56px header used only on ≥lg. Contains the Riktning
 * wordmark on the left and the current user's email + sign-out on the right.
 *
 * Intentionally minimal: no search, no notifications, no avatar dropdown.
 * Riktning is not that kind of app.
 */
export const DesktopTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <header
      className="hidden lg:flex items-center justify-between px-8 sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border-soft"
      style={{ height: 64 }}
    >
      <div
        className="text-[20px] font-extrabold tracking-tight"
        style={{ color: "hsl(var(--foreground))" }}
      >
        Riktning
      </div>
      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="text-[14px] font-bold text-text-secondary truncate max-w-[260px]">
            {user.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] font-extrabold text-foreground/80 hover:bg-surface-alt press-soft"
          aria-label="Logga ut"
        >
          <LogOut size={15} strokeWidth={2.4} />
          Logga ut
        </button>
      </div>
    </header>
  );
};
