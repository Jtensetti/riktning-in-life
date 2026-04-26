## Utgångsläge — vad vi redan har

Den deterministiska motorn är redan stark:

- `timeContext` (morgon/midday/eftermiddag/kväll/natt + säsong + helg)
- `weather` med outdoor-friendly + dagsljusflagga
- `recommendForToday` med slot-modell, repetitionsstraff, energibudget
- `buildEveningPrediction` + `buildDayHighlights` + `buildLiftSummary`
- `PersonalBaseline` med median+IQR per fält
- `streakCounts` per check-in/aktivitet/session

**Diagnos:** Appen *räknar* mycket — men UI:t reagerar lite. Du ser samma hero, samma rubrik, samma struktur oavsett om det är tisdag morgon med solsken eller söndag kväll efter en tung vecka. Det är där känslan av "den känner mig" tappas.

Sex spår, från mest till minst synligt. Allt deterministiskt — inga AI-anrop, ingen ny tabell om vi inte måste.

---

### Spår 1 — Levande hero ("appen ser likadan ut" → "appen andas med dagen")

**Idag:** `HeroBanner` på Today får `tone = heroToneFor(partOfDay)` och en fast ikon. Två av fem tider använder samma orange.

**Förändring:**
- Bredda paletten: morgon=orange, midday=yellow, eftermiddag=blue, kväll=purple, natt=djup-purple. Lägg in **säsongstint** ovanpå (vinter = kallare blå-undertone, sommar = varmare). En liten subtil shift, inte en ny färg.
- **Dynamisk ikon** på heron: `sun` på morgonen, `moon-stars` på kvällen, `cloud-soft` vid mulet väder, `rain-drop` vid regn, `snow` vintertid med kyla, `leaf` höst. Vi har redan ikonbiblioteket i `AbstractIcon`.
- **Float-amplitud** följer energin: låg energi → långsammare, mjukare animation; hög energi → snabbare. CSS-variabel `--float-duration` styrd från React.
- **Pattern-cirklar** på/av baserat på `safety_status` — ingen lekfullhet vid akut signal.

**UI-arbete:** Liten utvidgning av `HeroBanner` (lägg till `mood?: "calm" | "neutral" | "lively"`-prop), ny helper `heroVisualsFor(time, weather, checkin, season)`. Inga nya assets.

---

### Spår 2 — "Välkommen tillbaka" (kontinuitet mellan besök)

**Idag:** Hälsningen är `"God morgon"` oavsett om du var här för 10 min sen eller 4 dagar sen.

**Förändring:** Spara `lastSeenAt` i `localStorage` vid varje Today-render. När den nästa gång läses, härled:
- `<2h sedan` → ingen ändring
- `samma dag, >4h` → "Välkommen tillbaka" istället för standardhälsning
- `igår` → "Välkommen tillbaka. Igår var en {bästa/tyngsta/stabil} dag." (vi har `buildDayHighlights`)
- `>2 dagar` → "Skönt att se dig igen. Vi väntade." (varm, aldrig skuldbeläggande)
- `>7 dagar` → "Välkommen tillbaka. Vi börjar om mjukt — bara en check-in idag räcker." + döljer nästan allt utom QuickLog och en enda mjuk övning.

**UI-arbete:** Ny `src/lib/lastSeen.ts` (~20 rader) + ersätt rubriken på Today.

---

### Spår 3 — Kontextkänslig öppningssektion ("vad du först ser")

**Idag:** Today renderar alltid samma sektioner i samma ordning: Hero → State → För dig → Highlights → Quicklog osv.

**Förändring:** Inför en **"Top of mind"-slot** allra först (efter hero, före allt annat). Vad som hamnar där bestäms av en enkel prioritetsfunktion `topOfMindFor(time, weather, checkin, baseline, lastSeen)`:

| Trigger | Visas |
|---|---|
| `safety_status` = akut/aktiv | Direkt safety-card, inget annat ovan |
| Ingen check-in idag + det är >12 | "Hur är dagen så här långt?" — direkt-inline check-in (3 sliders, save inline) |
| Ingen check-in idag + morgon | "En mjuk start: bara välj en känsla." — 5 emoji-knappar som triggar QuickLog |
| Hög oro idag (>baseline) | EveningPredictionCard flyttas upp + ett andnings-CTA |
| Solen är ute + ingen rörelse loggad + dagtid | "Solen är uppe nu. 10 min ute räknas." — direkt CTA till promenadövning |
| Tidigare i veckan: kort sömn 2 nätter + det är kväll | "Du har sovit kort. Här är din kvällsritual." |
| Inget av ovan | Standardflöde |

**UI-arbete:** En ny komponent `TopOfMind.tsx` (renderar alltid bara *en* sak), ny helper `src/lib/topOfMind.ts` med ren beslutslogik (lätt att enhetstesta). Återanvänder befintliga ColorCard/QuickLogPills.

---

### Spår 4 — Mikro-läroögonblick (knyt data till kunskap)

**Idag:** `Learn`-artiklar finns men ligger i sin egen flik. Du får ingen artikel *när den är relevant*.

**Förändring:** När en daglig signal triggar något specifikt, visa en lågmäld **läs-1-min-rad** under det relaterade kortet:
- Hög oro 3+ dagar → "Varför andning faktiskt funkar (1 min)" (länk till befintlig artikel)
- Kort sömn 2+ nätter → "Vad sömnskuld gör med oron (1 min)"
- Mycket säng/soffa → "Aktiveringsspiralen — och vägen ut (1 min)"

Vi har redan `learn_articles`-tabellen och `read_minutes`. Det vi behöver är en koppling: en `topic_tag` per artikel (`"anxiety" | "sleep" | "activation" | ...`) och en helper som matchar mot dagens dominanta signal.

**UI-arbete:** Migration som lägger `topic_tag text` på `learn_articles` (nullable, sätts manuellt), ny `src/lib/learnMatch.ts`, en liten inline-rad i Today-flödet.

---

### Spår 5 — Levande streak-feedback

**Idag:** `StreakRing` visar siffror men berättar inget om *betydelse*.

**Förändring:** När `streakCounts.checkin >= 5/7`, visa under ringen: "Veckor då du loggar ofta tenderar att kännas lättare för dig." (bara om vi har data som styrker det — annars en mjuk default: "Loggandet är hur vi ser mönster.")

Lägg också in **micro-celebration**: när en streak passerar 3 / 7 / 14 / 30 dagar, en kort konfetti-fri animation (mjuk pulse + en rad text). Använder befintlig `animate-pop-in` + ny `streakMilestone()`-helper.

**UI-arbete:** Liten extension av `StreakRing` + `useEffect` som detekterar tröskelpassage via `localStorage`-snapshot.

---

### Spår 6 — Adaptiv ton i copy

**Idag:** Copy är genomgående mjuk och fin — men *samma* mjukhet vid 4h sömn som vid 8h sömn.

**Förändring:** Inför `src/lib/tone.ts` med `getToneFor(checkin, baseline) → "tender" | "steady" | "energized"`. Tre varianter av varje rubrik på Today:
- `tender` (hög tyngd/oro/kort sömn): "Idag räcker det att andas."
- `steady` (i baslinjen): "Det här räcker idag."
- `energized` (över baslinjen, god sömn): "Bra ingång — använd det."

**UI-arbete:** Ren copy-tabell + en helper. Ingen ny komponent.

---

## Vad jag *inte* föreslår

- **Inga push-notiser eller bakgrundsjobb** — appen är fortfarande klient-only utan service workers; vi gör allt vid render.
- **Ingen AI-genererad copy** — risk för svaj ton, allt deterministiskt.
- **Ingen ny "feed"-modell** — vi använder befintliga sektioner och bara *ordnar om* + lägger en topp-slot.
- **Inga procent ut till användaren** ("47% bättre") — håller oss till "ofta", "tendens", "verkar" som idag.

---

## Förslag på leveranspaket

Tre möjliga storlekar:

1. **Snabb effekt (spår 1 + 2 + 6)** — hero andas, hälsningen minns dig, copy anpassas. Ingen migration, allt i lib + Today + HeroBanner.
2. **Medel (1+2+3+6)** — också "Top of mind"-sektionen som faktiskt byter vad du ser först.
3. **Hela paketet (1–6)** — också mikro-lärande och streak-firande. Kräver en liten migration på `learn_articles.topic_tag`.

Säg vilket paket du vill köra på, eller plocka enskilda spår — så bygger jag i nästa steg.