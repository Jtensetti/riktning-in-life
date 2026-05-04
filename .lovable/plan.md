## Mål

Desktop ska sluta vara "uppskalad mobil" och bli en **överblicks- och reflektionsyta**: visa samband, jämförelser och nästa rimliga handling. Mobilen ändras inte.

Briefen är stor — den rör 9 sidor + flera nya komponenter. För att hålla kvalitet och inte bryta något arbetar vi i **fyra faser**, där varje fas är leverabel i sig och du kan stoppa när som helst.

---

## Designprinciper (gäller hela planen)

Innan något flyttas runt: tre desktop-byggstenar införs som återanvänds överallt, så att vyerna får samma språk:

1. **`<DayMat>`** — kompakt grid av kvadratiska aktivitetsbrickor (40–48 px), färg=kategori, ikon=typ, hover visar namn+effekt. Ersätter "lista med rektangulära aktivitetskort" på desktop där dagen ska överblickas.
2. **`<ActivityTile>`** — kvadratiskt aktivitetskort (~120×120) med ikon centrerad, titel under, favorit-stjärna i hörnet, vald-state med kant+bock. Används i ActivityPicker, Snabblogg, "vad gjorde dagen av".
3. **`<RightColumn variant="recommendation|context|evidence|tools">`** — semantisk högerkolumn så vi slutar fylla högerytor med "extrakort". Varje sida deklarerar vilken roll dess högerkolumn har.

Färglogik (förtydligas i `tailwind.config.ts` + `chartColors.ts`):
grön=återhämtning/riktning · blå=vård/kropp/mätning · rosa=mående/socialt · gul=lärande/lätt start · orange=igångsättning/energi · lila=sömn/inre fokus. Vi går igenom en sida i taget och rättar avvikelser.

---

## Fas 1 — Grund + sidonav + Idag som cockpit

**Sidonav (`SideNav.tsx`)**
- Ikoner 18–20 px optisk storlek (idag 26 i bredd men tunna), starkare strokeWidth, alla optiskt lika stora.
- Aktivt läge: färgat streck + ikon i sektionsfärg + text i sektionsfärg + tydligare textvikt (redan delvis där, gör konsekvent).
- Snabblogg-rutorna under "Snabblogg"-rubriken: större ikoner (28 px), tooltip vid hover, hover-bg, konsekvent ruta.

**Idag (`Today.tsx`) — cockpit-disposition på desktop**
Idag är masonry idag, vilket ger "samma kort, bara två kolumner". Byts till explicit cockpit-grid på `lg`:

```text
┌─────────── vänster (1.4fr) ───────────┐  ┌──── höger (1fr) ────┐
│ Dagens status   (check-in, mood,      │  │ Rekommendation just  │
│  energi, oro, sömn — kompakta pills)  │  │ nu (med "varför")    │
│                                        │  │                      │
│ Dagens handling                        │  │ DayMat — dagens      │
│  (snabbloggchips + journalstart)       │  │ aktiviteter som      │
│                                        │  │ kompakt grid + sum   │
│ Dagens riktning                        │  │                      │
│  (mini-insikt: "Bättre än igår" osv)   │  │ Vad verkar hjälpa    │
│                                        │  │ (försiktig text)     │
│ Baslinje/streak                        │  │                      │
│                                        │  │ Saknas idag          │
└────────────────────────────────────────┘  └──────────────────────┘
```

Mobilen behåller dagens vertikala stack (bytet sker bara `lg:`).

Nya små komponenter som Today använder:
- `<DayMat>` (visas i höger kolumn istället för "Senaste aktivitet"-listan).
- `<MissingToday>` — mjuk lista över vad som inte loggats idag. Tyst när allt finns.
- `<DirectionMicroInsight>` — en rad text som jämför idag mot 7-dagars-snitt (oro/energi/rörelse).

Rekommendationskortet får ett kort "varför" under titeln som härleds från dagens data ("Du har lite rörelse loggad idag").

---

## Fas 2 — ActivityPicker + Snabblogg som bibliotek

**ActivityPicker (`ActivityPicker.tsx`)** — den största visuella vinsten.
Idag: rader i två kolumner. Blir på desktop:
- Sticky topp: titel + hjälprad + sökfält + filterchips (finns redan).
- Sektioner: **Senast använda · Favoriter · Rekommenderat just nu · Kategorier**.
- Innehåll i varje sektion: **`<ActivityTile>`-grid**, 5–6 kort per rad på desktop, 3 på tablet, 2 på mobil.
- Multi-select-läge: klicka flera, "Spara X aktiviteter" i sticky botten. Varje vald får tydlig kant + bock.
- "Rekommenderat just nu" härleds från tid på dygnet + senaste loggar (samma logik som finns i `recommend.ts`/`relevance.ts`).

Mobilen får samma grid men 2 per rad (det är fortfarande tätare än idag och fungerar lika bra som lista).

**Snabblogg (`QuickLog.tsx`)** — desktopens "snabba inmatningsbänk":
- Topp: 4 stora kvadratiska kort (Sömn, Kropp, Mående, Medicin) — finns redan, görs lite större.
- Mitten: `<ActivityTile>`-grid (favoriter + senast använda + rekommenderat) med multi-select. "Spara dagens aktiviteter" som en knapp.
- Botten: "Senaste idag" som DayMat istället för långa rader.

---

## Fas 3 — Insikter, Analys och Veckomatta

**Veckomatta (`<WeekMat>`)** — ny komponent: 7 kolumner (mån–sön), varje kolumn visar mood/energi/oro som färgade staplar, små aktivitetsikoner under, journalprick, idag-markering. Tomma dagar visar "Inget loggat" tyst. Återanvänds i Insikter och Analys.

**Insikter (`Health.tsx`)** — "vad betyder veckan?":
- Vänster (berättande): Veckans viktigaste signal · Vad verkar hjälpa · Vad verkar tynga · Liten rekommendation.
- Höger (bevis): Veckomatta · aktivitetsfördelning · check-in-frekvens · små diagram.
- Tar bort dagens "Bygger baslinje"-kort från Insikter på desktop (den hör hemma på Idag).

**Analys (`Analysis.tsx`)** — "vad visar datan?":
- Topp: veckans sammanfattning i en panel.
- Vänster: förändringar (oro, tyngd, sömn, energi, funktion, rörelse) med trendlinje + texttolkning + "vs förra veckan".
- Höger: **samband** som textkort ("Dagar med rörelse sammanfaller oftare med lägre oro"). Beräknas enkelt från `daily_summaries` (Pearson eller bara medel-jämförelse på dagar med/utan rörelse). Försiktigt språk: "verkar", "ofta", "kan vara värt att prova".

---

## Fas 4 — Vård, Journal, Krisplan, Inställningar

**Vård (`Vard.tsx`)** — redan WideLayout, finslipas:
- Vänster: krisplan-kort + veckoskattningar (status: "PHQ-9 senast 27 apr · Måttlig" istället för bara senaste poäng).
- Höger: läkemedel + rapport + "Saknas inför nästa besök" (vilka skattningar är >14 dagar gamla).

**Journal (`Journal.tsx`)** — list-mode redan WideLayout, edit-mode behåller fokus:
- List: vänster = mallar i grid + "skriv nytt", höger = senaste anteckningar med filter/sök.
- Edit: vänster = textfältet (som idag), höger = `RightColumn variant="context"` med "Byt mall" + "Senaste" (finns redan, förtydligas).

**Krisplan (`CrisisPlan.tsx`)**:
- Vänster: formuläret (idag).
- Höger (kontext): sammanfattning live · akutkontakter · "senast uppdaterad" · korta tips.
- Sparknappen: ta bort den stora svarta sticky-knappen på desktop, lägg slutknapp i form-flöde + diskret toppknapp.

**Inställningar (`Settings.tsx`)**:
- Behåll en kolumn (det är redan en kontrollsida), men dela upp tydligt i sektionerna konto/påminnelser/plats/automatik/data/om. Eventuell smal höger-panel med "Vad sparas?"/exportstatus. Inte en dashboard.

---

## Vad jag inte gör i denna omgång (sparat för senare)

- **Historik per dag-kort** med aktivitetsbrickor: stor egen sak, hör hemma i en separat omgång på Snabblogg/Idag-historik. Kan tas i fas 5 om du vill.
- **Aktivitetsmetadata "typisk effekt"** i katalogen: bra idé, men kräver schemaändring + datajobb. Lyfter vi separat.
- **"Vanliga den här tiden på dagen"-sortering** i picker: lägger grundgridden nu, smartare sortering kan komma efter.

---

## Två snabba frågor innan jag börjar

1. **Fasordning** — är **fas 1 (cockpit + sidonav) → fas 2 (ActivityPicker/Snabblogg) → fas 3 (Insikter/Analys + Veckomatta) → fas 4 (Vård/Journal/Krisplan/Inställningar)** rätt prioritet, eller vill du börja någon annanstans (t.ex. ActivityPicker först eftersom den ger mest synlig effekt)?

2. **Mobilen och kvadratiska aktivitetskort** — du säger "allt ska inte bli kvadratiskt". På mobilen idag är ActivityPicker rader. Ska mobilen behålla rader och bara desktop få grid, eller ska mobilen också få en (tätare) 2-kolumnsgrid med kvadratiska kort? Min defaultplan är: **mobil får också grid (2 per rad)** eftersom det är tätare och appigare, men jag gör det enkelt att backa om du vill behålla rader.

Säg bara "kör fas 1" eller "kör allt i ordning" eller "börja med ActivityPicker", så drar vi igång.
