# Desktop-fix v3 — baserat på dina skärmdumpar + feedback

Fyra konkreta problem, en sak åt gången. Mobil rörs inte.

## 1. Snabblogg-modalerna (sömn/kropp/mående/medicin)

Idag: centrerad 720px-modal, men innehållet ser "konstigt" ut — 5h/6h/7h/8h/9h som tunna piller + en separat ±-rad + 0–10-knappar i en lång rad. Det är två UI-paradigm på samma yta.

**Tillbaka till "den gamla vyn"-känslan men contained:**
- Behåll centrerad modal `max-w-[560px]` (smalare än 720, mer "kort" än "panel")
- Sömn: stor läsbar timme-display (48px siffra) + ±-knappar (40×40) — INTE pillerraden 5h–9h
- Kvalitet 0–10 + Mående -2…+2: rendera som **enhetlig knapprad** i full bredd, en knapp = `flex-1`, höjd 48px, vald = primary-bg
- Medicin: 3 stora kort (Tagen / Delvis / Hoppade) som i mobil — inte trångt
- Bottenknappen "Spara" i sticky footer med 16px padding
- Mobil: oförändrad bottom-sheet

Fil: `src/components/ui/drawer.tsx` (justera lg:max-w), `src/pages/QuickLog.tsx` (rendering)

## 2. Rensa ALLA emojis

Hittade dessa:
- `src/pages/Checkin.tsx:29` — `moodEmoji` (😊🙂😐🙁😔)
- `src/pages/Checkin.tsx:347` — `"✓ Förfyllt..."`
- `src/pages/QuickLog.tsx:774` — mood-rad med emojis
- `src/pages/QuickLog.tsx:941–943` — medicin ✅🟡⛔
- `src/pages/Today.tsx:816` — `"✓ Du har redan loggat..."`
- `src/pages/Journal.tsx:406` — `"✓ Inkluderas i rapport"`
- `src/components/desktop/WeekMat.tsx:230` — `"✓"`

Ersätt med **lucide-ikoner** (Check, Circle, X, Minus, SmilePlus etc.) eller bara text. Mood-skalan blir nummer-knappar -2…+2 med textetikett ("Tungt" / "Neutralt" / "Lätt"). Medicin blir Check/MinusCircle/XCircle.

## 3. Idag — scrollas trots desktop-grid

Skärmdumpen visar att högerkolumn slutar vid "Rekommenderat just nu"-kortet och allt annat (Senaste aktivitet, Att hålla ett öga på) ligger i mittenkolumnen som scrollar. "Hur har du det?"-CTA upprepas onödigt nedanför streck-knappen.

**Omkomposition (`src/pages/Today.tsx` lg-grenen):**
```
┌─ kompakt header ──────────────────────────────────┐
├──────────────┬───────────────┬─────────────────────┤
│ VÄNSTER 30%  │ MITT 40%      │ HÖGER 30%           │
│ Check-in     │ "Hur har du   │ Rekommenderat       │
│ progress     │  det?" CTA    │ just nu             │
│ Tre rader    │ (en gång!)    │                     │
│ State chip   │ Välj liten    │ För dig (3 kort,    │
│ Baseline     │ start         │ stack på höjden)    │
│              │ Snabblogga    │                     │
│              │ favorit       │ Senaste aktivitet   │
│              │               │ (5 senaste)         │
│              │               │ Att hålla öga på    │
└──────────────┴───────────────┴─────────────────────┘
```
- "För dig"-korten staplas vertikalt i höger 30%-kolumn (inte 3-grid över hela bredden) → inget tomrum
- "Hur har du det?"-rad renderas EN gång
- Senaste aktivitet flyttas från botten till höger, max 5 rader med "Visa fler" → ingen scroll behövs på 1080p

## 4. Insikter — scrollas, högerkolumn tom

Skärmdumpen: Veckomatta + Snabb-sammanfattning + Veckans bild i vänster, Playbook i höger — sedan tom höger medan Dagens lilla steg + Riktning-graf + Vad gjorde dagen + dagslista alla staplas i vänster och kräver scroll.

**Omkomposition (`src/pages/Insikter`/Week-aktuell fil):**
```
┌─ Veckomatta (full bredd, 7 kolumner, kompakt 280px höjd) ─┐
├──────────────────────────────┬─────────────────────────────┤
│ Veckans riktning-graf (stor) │ Veckans playbook (sticky)   │
│ + #1 prioritet under         │                             │
├──────────────────────────────┤ Dagens lilla steg           │
│ Veckans bild (narrativ)      │                             │
├──────────────────────────────┤ Snabb sammanfattning →      │
│ Vad gjorde dagen av (bars)   │ analysvyn                   │
├──────────────────────────────┴─────────────────────────────┤
│ Dagslista (7 dagar i 3-kol grid, inte vertikal stack)      │
└────────────────────────────────────────────────────────────┘
```
- Höger aside blir `sticky top-20` så playbook+dagens steg följer med vid scroll
- Dagslistan går från 7 vertikala kort → 3-kolumns grid längst ner (inget scroll-block)
- Riktning-grafen lyfts upp så den syns above the fold

## 5. Krisplan — för smal

Skärmdumpen: innehållet (rubrik + signaler + akutkontakter) ligger i ~720px centrerat på en 1575px-skärm. AppShell ger 1440px men `<CrisisPlan>` använder antagligen `density="reader"` eller har inre `max-w`.

**Fix:** Byt till desktop-grid när lg+:
```
┌─ Stort hero (orange curved) — behåll ──────────────────────┐
├──────────────────────────────┬─────────────────────────────┤
│ VÄNSTER 60%                  │ HÖGER 40%                   │
│ Signaler senaste 14 dagarna  │ AKUT — alltid en knapptr.   │
│ Tidiga varningstecken        │  (4 kontakter, större)      │
│ Det här hjälper mig          │                             │
│ Det här ska jag undvika      │ LÄGET JUST NU (sticky)      │
│ Personer jag kan ringa       │                             │
│ Professionella kontakter     │ Snabbgenvägar:              │
│ Trygga platser               │  → Skapa vårdrapport        │
│ [Spara min krisplan]         │  → Skriv i journalen        │
└──────────────────────────────┴─────────────────────────────┘
```
Form-fälten utnyttjar full bredd av vänster 60% (idag är de 320px breda mitt i en tom yta).

Fil: `src/pages/CrisisPlan.tsx` — ta bort eventuell `max-w-xl` på innerwrapper, byt till `lg:grid lg:grid-cols-[1fr_400px] lg:gap-8`.

## Leveransordning

1. **Emoji-rensning** (snabbt, 7 ställen)
2. **Snabblogg-modaler** (störst visuell vinst)
3. **Krisplan-grid** (enkel layout-fix)
4. **Idag-omkomposition** (mer arbete, högst impact mot scroll)
5. **Insikter-omkomposition** (samma omfattning som Idag)

Säg till om jag ska köra hela kedjan eller börja med 1+2+3 (snabba vinster) först.
