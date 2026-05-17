import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Illustration } from "@/components/Illustrations";
import { haptic } from "@/lib/haptics";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSending(false);
    if (error) {
      haptic("error");
      toast.error("Det gick inte att skicka länken. Försök igen.");
      return;
    }
    haptic("success");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop-only sidopanel — varm illustration får fylla halva skärmen
       *  istället för att appen ser ut som en mobil-modal mitt på 1575 px. */}
      <aside
        aria-hidden
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, hsl(var(--orange-start) / 0.12), hsl(var(--cream-card)))" }}
      >
        <div className="max-w-[480px] w-full">
          <Illustration name="start" className="w-full h-auto" />
          <p className="mt-8 text-base text-text-secondary leading-relaxed text-center">
            Logga lite varje dag. Riktning visar mönstren — du behåller riktningen.
          </p>
        </div>
      </aside>

      <main className="flex-1 max-w-md w-full mx-auto px-6 pt-10 lg:pt-24 flex flex-col lg:justify-center">
        <div className="mb-6 lg:hidden">
          <Illustration name="start" className="w-full h-auto" />
        </div>
        <h1 className="text-[32px] leading-[38px] text-foreground text-center lg:text-left mb-3">Riktning</h1>
        <p className="text-base text-text-secondary text-center lg:text-left mb-10">
          Små steg åt rätt håll. Inte diagnostisk – ett verktyg för dig och din vård.
        </p>

        {sent ? (
          <div className="card-cream p-6 text-center">
            <h2 className="text-xl mb-2">Kolla mejlen</h2>
            <p className="text-text-secondary text-sm">
              Vi skickade en inloggningslänk till <strong className="text-foreground">{email}</strong>. Öppna länken på den här enheten.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <label htmlFor="email" className="block text-sm font-bold text-text-secondary">
              Din mejladress
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@exempel.se"
              className="h-14 rounded-2xl border-2 border-border-soft bg-surface text-base px-5"
              autoComplete="email"
              autoFocus
            />
            <Button
              type="submit"
              disabled={sending}
              className="w-full h-14 rounded-full text-[17px] font-extrabold bg-orange-start hover:bg-orange-deep text-white shadow-soft"
            >
              {sending ? "Skickar..." : "Skicka inloggningslänk"}
            </Button>
            <p className="text-xs text-text-secondary text-center pt-2">
              Du får en länk per mejl. Inget lösenord behövs.
            </p>
          </form>
        )}
      </main>
    </div>
  );
};

export default Auth;
