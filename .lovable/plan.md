## Tre konkreta justeringar — baserat på din skärmdump (IMG_3630, IMG_3632)

Inget redesignas. Vi rör tre filer + en token.

---

### 1. Aktivitetskorten i pickern (`src/components/ActivityPicker.tsx`)

Problem syns i IMG_3630: "Promena", "Långpror i…", "Styrketr…" klipps. Ikonen tillför inget när texten redan är ordet "Cykla". Stjärnan är för dominant.

**Ändringar i `PickerCard`:**
- **Ta bort IconTile.** Kortet får bara titel + stjärna. Mer luft för texten.
- **Titel:** `text-[16px] leading-[20px] font-extrabold`, `line-clamp-2` (tidigare 18/22). Räcker för "Långpromenad i naturen" på två rader utan ellipsis.
- **Padding** ökar från 16 → 18 horisontellt så texten andas.
- **Stjärna:** 22px (från 28), opacity 0.4 inaktiv / 1.0 aktiv. Position oförändrad (top-2 right-2), klickyta behålls 32×32.
- **Höjd** sänks 96 → 88px så griden känns lättare.
- Vänsterjustera titeln vertikalt centrerat — utan ikon blir layouten enklare: en `<button>` med `flex items-center justify-start`.

**Sektionerna ovanför pickern** (Senast/Favoriter/kategorier) påverkas inte — bara kort-renderingen ändras, så alla sektioner får samma nya look automatiskt.

---

### 2. Avlasta lila — använd bara för sömn (`src/lib/screenIdentity.ts` + `src/components/ActivityPicker.tsx`)

Just nu sitter lila som hela bakgrundsfärgen 17:00–05:00 på Idag-headern (5 + 7 timmar/dygn) **och** används default på vad som helst i pickern utan tydlig kategori (Stretching, m.fl. — synligt i din skärmdump).

**Ändringar:**
- `screenIdentity.ts` rad 54–55:
  - `evening` (17–22) → `--orange-deep` (varm landning, inte sömn ännu)
  - `night` (22–05) → `--blue-calm` (lugn, men inte sömn-lila)
  - Lila reserveras till faktiska sömn/insomningsmoduler.
- `ActivityPicker.tsx` `colorBg`: defaultfallback ändras från `bg-cream-card` till `bg-blue-calm/15 text-foreground` så att aktiviteter utan explicit färg blir lugnt blåtonade i stället för att ärva något lila/grått. Lila-grenen behålls bara för items där `color === "purple"` (sömn-relaterat).
- Inga andra "purple" på sidor rörs — de sitter på rätt ställen (sömn-rekommendationer, kvällslandning, sömnchart). Det är kvälls-headern + picker-defaulten som var överdriven.

---

### 3. Vård-sidan får färg (`src/pages/Vard.tsx`)

Problem i IMG_3632: blå header → vit + cream content + bleka ljusblå ikoner = "sjukhus". Vård **ska** vara blå (det är dess identitet) men kontentan behöver värme och kontrast.

**Ändringar — inga nya komponenter, bara uppdaterade tones:**

- **Krisplan-kortet** (rad 93–106): behåll rött tema, men byt till varmare bakgrund `bg-red-bg` → ljusare orange-rosa `bg-[hsl(var(--red-risk)/0.08)]` med starkare ikon-tile (`bg-red-risk` solid, vit ikon). Mer levande än dagens ljusrosa.
- **Veckoskattningar PHQ-9 / GAD-7 / WHO-5** (rad 112–137): byt från enhetlig blå ikon-tile till tre olika varma toner som följer skattningens karaktär:
  - PHQ-9 (depression) → `bg-yellow-journal/15` + gul ikon
  - GAD-7 (ångest) → `bg-pink-move/15` + pink ikon
  - WHO-5 (välbefinnande) → `bg-green-recovery/15` + grön ikon
  - Behåll kortbakgrund `card-soft` (cream) men lägg till tunn vänsterkant 4px i samma ton för identitet.
- **Läkemedel-kortet** (rad 143–155): höj ikon-tonen — `bg-pink-move` solid + vit ikon i stället för 15% pink. Behåll cream cardbakgrund.
- **Rapport-kortet** (rad 160–175): redan blått, men minska opacity på undertext från `opacity-90` → kvar, och byt illustration-bakgrund till en mer mättad blå (`bg-blue-deep`-overlay 8%) så det inte ser blekt ut bredvid de nya färgade korten.

Nettoresultat: blå förblir Vårds identitetsfärg (header + Rapport-CTA), men sektionerna mellan får varma accenter så sidan känns färgglad i stället för klinisk.

---

### Verifiering
- `tsc --noEmit`
- Visuell smoke på `/vard` och pickern (mobil 390px).
- Designtest (`design-system.test.ts`) påverkas inte — vi byter bara toner, inga nya `text-[NNpx]` eller HeroBanner-import.

**Filer som rörs:**
- `src/components/ActivityPicker.tsx`
- `src/lib/screenIdentity.ts`
- `src/pages/Vard.tsx`
