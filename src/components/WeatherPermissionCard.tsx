import { Button } from "@/components/ui/button";
import { AbstractIcon } from "./AbstractIcon";

interface Props {
  onAllow: () => void;
  onDismiss: () => void;
}

/**
 * Mjuk in-app prompt INNAN vi triggar webbläsarens geolocation-popup.
 * Visas en gång när användaren öppnar Idag och vi inte vet om plats.
 */
export const WeatherPermissionCard = ({ onAllow, onDismiss }: Props) => {
  return (
    <section className="card-cream p-5 mb-7 animate-pop-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0">
          <AbstractIcon name="weather-partly" size={48} color="hsl(var(--orange-start))" accent="hsl(var(--cream-card))" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-extrabold mb-1">Anpassa efter vädret</h3>
          <p className="text-sm text-text-secondary">
            Vädret påverkar humör och energi. Med din plats kan vi föreslå rätt sak just nu — och spara vädret automatiskt i din logg.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onAllow}
          className="flex-1 h-11 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold press-soft"
        >
          Tillåt plats
        </Button>
        <Button
          onClick={onDismiss}
          variant="secondary"
          className="h-11 rounded-full font-extrabold press-soft"
        >
          Inte nu
        </Button>
      </div>
    </section>
  );
};
