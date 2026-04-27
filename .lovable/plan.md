# Polera WYSIWYG-editorn (endast desktop)

Mobilvyn lämnas helt orörd — all logik bakom `isMobile` behålls som den är. Endast desktop-grenarna ändras.

## Mål
Få editorn att kännas lika självklar som Notion/Linear/Medium: verktyg där man förväntar sig dem, tydliga active-states, flytande bubble-menu vid markering, och de kortkommandon man räknar med.

## Ändringar

### 1. Flytta toolbar till TOPPEN av editorn (desktop)
Konventionen är verktyg ovanför innehållet. `border-t` blir `border-b`, toolbar renderas före `<TipTapEditor>` i desktop-grenen. Mobilens fixed-bottom-toolbar är oförändrad.

### 2. Vänsterställ desktop-toolbaren
Byt `justify-center` → `justify-start` med lite padding. Knapparna slutar "hoppa" när toolbar växlar läge.

### 3. Visa direktknappar istället för popovers (desktop)
På desktop finns gott om plats. Default-toolbaren får direktknappar:

```text
[B] [I] [S]  |  [H1] [H2] [H3]  |  [• lista] [1. lista] [" citat]  |  [🔗 länk] [— hr]  |  [↶ ångra] [↷ gör om]
```

Popoverna för "Infoga", "Listor" och "Textstil" tas bort på desktop (mobilen behåller dem för plats).

### 4. Active-states på alla knappar
Varje toolbar-knapp läser `editor.isActive('bold')`, `editor.isActive('heading', { level: 2 })` osv och får `bg-surface-alt` + tydligare ikonfärg när aktiv. Detta är den viktigaste WYSIWYG-signalen — användaren ser var markören står.

För att toolbaren ska re-rendra vid varje selektion exporteras `editor`-instansen via en ny `getActiveStates()` på `TipTapEditorHandle`, eller (renare) toolbaren tar emot `editor`-objektet direkt i desktop-läget.

### 5. Bubble-menu vid markering (desktop)
Lägg till `@tiptap/extension-bubble-menu`. När text markeras visas en flytande mini-toolbar ovanför markeringen med: **B / I / S / länk / H2 / citat**. Detta är desktop-konventionen och ersätter den fula växlingen i den fasta toolbaren.

Den fasta topptoolbaren behåller alltid sina default-knappar (växlar inte längre läge på desktop) — så layouten blir stabil.

### 6. Redo-knapp + Cmd+K-genväg
- Lägg till "Gör om" (`redo`) bredvid "Ångra". `Cmd/Ctrl+Shift+Z` finns redan inbyggt i TipTap.
- Globalt `Cmd/Ctrl+K` öppnar `LinkInsertSheet` (popover på desktop) — branschstandard.

### 7. Länkredigering
När markören står i en länk visar bubble-menun istället: **[öppna ↗] [redigera] [ta bort]**. Implementeras genom att läsa `editor.isActive('link')` och få attributen via `editor.getAttributes('link').href`. "Ta bort"-knappen anropar `unsetLink()`.

### 8. Fixa `setLink` att respektera `text`-argumentet
`TipTapEditor.setLink(url, text?)`: om `text` skickas och ingen markering finns, infoga `<a href="url">text</a>` via `insertContent`. Idag tappas argumentet helt.

### 9. Småjusteringar
- Placeholder-opacity 60 → 80 för läsbarhet.
- Ta bort `onHideKeyboard`-prop på desktop-grenen (dead code).
- Strikethrough flyttas till bubble-menu only (sällan använd vid skrivande, finns när man behöver redigera).
- Editorns ytterdiv: `rounded-2xl` behålls, men toolbar i toppen får `rounded-t-2xl` och innehållet sömlös övergång.

## Tekniska detaljer

**Filer att redigera:**
- `src/components/editor/RichTextEditor.tsx` — desktop-grenen byggs om: toolbar i toppen, bubble-menu monteras, Cmd+K-handler.
- `src/components/editor/RichTextToolbar.tsx` — ny `DesktopDefaultToolbar` med direktknappar + active-state-stöd. Mobilens `DefaultToolbar`/`SelectionToolbar` behålls oförändrade.
- `src/components/editor/TipTapEditor.tsx` — exponera `editor`-instansen via ref (för `isActive`-läsning), fixa `setLink(url, text)`, registrera `BubbleMenu`-extension.
- `src/components/editor/BubbleMenu.tsx` — **ny** liten komponent som renderar bubble-menu-innehåll (text-läge vs länk-läge).

**Beroenden att lägga till:**
- `@tiptap/extension-bubble-menu`

**Inga DB-ändringar, inga RLS-ändringar, inga edge functions.**
**Mobilkomponenter och mobilflöden är inte i scope.**

## Out of scope
- Bilduppladdning (medvetet uteslutet tidigare).
- Kodblock, tabeller, slash-meny — kan komma som steg 2 om du vill.
- Mobilvyn — orörd.
