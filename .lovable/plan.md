## Mål
Göra appen **lugnare, mer kort-driven och mer färgrik** — bort från dashboard-känslan med många små ikoner, mätare och chart-kort på rad. En skärm = en känsla, inte en kontrollpanel.

## Designprinciper (nya, gäller hela appen)
1. **Ett stort kort > fyra små.** Hellre ett 1-kolumns hjältekort som tar hela bredden än 2×2 grid med småmetriker.
2. **Färg bär hierarkin, inte ikonen.** Färgade ytor (hela kortets bakgrund) får göra jobbet. Ikoner används bara där de tillför mening — aldrig som dekorativ "chip-prick" bredvid varje rad.
3. **Typografi bär informationen.** Stora siffror/ord (text-[40-56px]) ersätter små metric-bricks med mini-ikoner.
4. **Max 1 ikon per kort.** Och då stor (32–40 px), inte 16–22 px.
5. **Luft.** Mer vertikal padding (p-6/p-7) i kort, mer mellanrum mellan sektioner (mb-8/mb-10), färre rader per skärm.
6. **Inga lucide-ikoner i listrader.** ChevronRight som "klickbar"-signal får finnas, men inga dekorativa Cog/Heart/Clock i rader.

## Skärm-för-skärm

### 1. Today (`src/pages/Today.tsx`) — största förändringen
**Bort:** små metrik-kort (Burden/Function/Recovery/Risk-rutorna), StreakRing-ringen i headern, ForecastEvidenceStrip, EveningPredictionCard som extra block, mini-ikon bredvid väder-chip.

**Kvar/förstärkt:**
- **Hero-kort i full bredd** överst: stor färgad yta i dagens ton (morgon=orange, kväll=lila), enda rubrik "God morgon, [namn]" + en mening om hur du har det. Ingen ikon, bara färg + typografi.
- **Dagens enda rekommendation som stort kort** (full bredd, p-7, 56px-rubrik). Ersätter dagens metric-grid.
- **For You-carousell** kvar (du gillade den) men kort blir större och färre ikoner per kort.
- **QuickLogPills** kvar men blir text-pills utan ikoner.
- Ta bort "Dagens steg"-kortet om checkin redan finns — visa istället ett mjukt status-kort i en lugn färg.

### 2. Insikter / Week (`src/pages/Week.tsx`)
**Bort:** stack av 4–5 chart-kort på rad (ChartCard × ActivityBars × StackedRecovery × Sparkline × WeekDirectionChart).

**Nytt:**
- **Ett stort "Riktning"-kort** överst (full bredd, färgad bakgrund) med en enda stor siffra (0–100) + en mening: "Senaste veckan rör sig åt rätt håll".
- **En enda graf** (WeekDirectionChart) under, som ett stort kort.
- **Två insikt-kort** i lugna kreamfärger med textuell insikt ("Du sov bättre på dagar du rörde dig" etc.) — ingen graf, bara typografi.
- Övriga charts flyttas till en separat **"Visa detaljer"-vy** (collapsible eller egen route `/insikter/detaljer`) så huvudvyn andas.
- Kliniskt-rapport-kortet flyttas längst ner som en lugn länk, inte en featured CTA.

### 3. Explore (`src/pages/Explore.tsx`)
- Carousell med övningar: gör korten större (w-[80%] istället för 72%), ta bort kategori-eyebrow-pillen — kategorin syns i färgen.
- Rutiner & Lär dig-rader: **ta bort de små 12×12 ikonrutorna** till vänster. Hela kortet får istället bakgrundsfärg från rutinen och en stor siffra/symbol om någon (t.ex. "AM" / "PM" / läs-minuter som stor text).

### 4. More (`src/pages/More.tsx`)
- Krisplan-kortet får vara stort & röd-tonat — det är bra som det är.
- Ta bort Settings-cog-ikonen i Inställningar-raden. Listan blir ren typografi + chevron.
- "Om Riktning" får vara en mjuk crémeruta utan ikon.

### 5. AppShell / global
- Bottom-nav: behåll men gör ikonerna något mindre (20px) och låt aktiv flik markeras med färgad pill bakom labeln istället för stor ikon-cirkel — labeln blir hjälte.

## Konkret arbete
1. **Today.tsx**: ta bort metric-grid, StreakRing-i-header, ForecastEvidenceStrip; ersätt med ett stort hero-statuskort + ett stort rekommendation-kort. Behåll carousell + QuickLogPills.
2. **Week.tsx**: kollapsa charts till 1 huvudgraf + 2 textinsikt-kort; flytta resten till expanderbar sektion.
3. **Explore.tsx**: ta bort små ikonrutor i Rutiner/Lär dig-rader, gör hela kortet färgat, större typografi.
4. **More.tsx**: städa Row-komponenten, ta bort dekorativa ikoner.
5. **QuickLogPills**: text-only variant.
6. **BottomNav**: aktiv-state via färgad pill bakom label, mindre ikoner.
7. **index.css**: lägg till en `.card-hero` utility (p-7, rounded-[28px], stor färg) och `.card-quiet` (kreamruta, bara typografi).

## Vad jag *inte* ändrar
- Färgpaletten (orange/blå/lila/grön/gul/rosa) — den är redan stark.
- Sitemap/navigation — den är nyligen omstrukturerad.
- Datalagret (Supabase, baseline, sync) — bara presentations-lagret rörs.
- AbstractIcon-paketet — bara *användningen* glesas ut.

## Risk
- Insikter-vyn tappar djup om man bara vill se rena charts — därför läggs detaljvyn som expanderbar/separat route, inget data försvinner.
- Användare som vant sig vid metric-grid på Today kan sakna siffrorna. Lösning: dom finns kvar i Insikter, bara ett swipe bort.

Säg till om du vill att jag drar igång hela rensningen, eller börjar med bara **Today + BottomNav** först som en första våg så vi kan se känslan innan resten städas.