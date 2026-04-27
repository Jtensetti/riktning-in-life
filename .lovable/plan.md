## Mål

Importera den TipTap-baserade WYSIWYG-editorn från `fediverse-career-newest` till Riktning och använd den för **Journals "Fri text"-mall** — både mobil och desktop. Strukturerade mallar (Tre rader, Tankeloop, Kropp först, Bevislogg) behåller sina enkla `Textarea`-fält. Inga bilder i denna runda.

## Vad som hämtas över (i trimmad form)

Editorn delas upp i fyra filer i `src/components/editor/`:

- **`TipTapEditor.tsx`** — TipTap-kärnan: StarterKit, Link, Placeholder. Image-extension utelämnad. Headings begränsade till H1–H3 (passar Riktnings tonläge bättre än 5 nivåer). Använder Riktnings tokens (`text-text-secondary`, `bg-surface`).
- **`RichTextToolbar.tsx`** — kontextuell toolbar: visar formaterings-tools när text är markerad, infogningsverktyg annars. Bild-knappar borttagna. Svensk copy ("Brödtext", "Rubrik 1", "Punktlista"…).
- **`LinkInsertSheet.tsx`** — bottom-sheet på mobil / popover på desktop för länkinsättning. `react-i18next` ersatt med ren svensk text (Riktning har ingen i18n).
- **`RichTextEditor.tsx`** — orkestrerare. Bilduppladdning och `useKeyboardHeight` borttagna. Mobiltoolbaren ligger `position: fixed` längst ner med `env(safe-area-inset-bottom)`-padding så den följer fokus-läget utan att kräva visualViewport-mätning. Stöd för `onSubmit` (Cmd/Ctrl+Enter sparar).

## Beroenden (redan installerade)

`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `dompurify`. Versioner: TipTap 3.22.4.

## Integration i Journal

I `src/pages/Journal.tsx`, i renderingen av "Fri text"-mallen (det `active === "free"`-grenen i editor-bodyn):

- Mobilgrenen (lg:hidden): `<Textarea value={free}…>` byts ut mot `<RichTextEditor value={free} onChange={setFree} placeholder="Tankar, känslor, dagen…" minHeight={220} onSubmit={save} />`.
- Desktopgrenen (lg:block): samma byte, `minHeight={420}`. Cmd+Enter-tipset i UI:t fungerar fortsatt; `onSubmit={save}` triggar samma path.

Övriga mallars `<Textarea>`-fält rörs inte.

## Säker rendering vid uppspelning

Editorn lagrar `free_text` som **HTML**. Det är säkert att skriva — det är användarens egen data — men måste renderas defensivt vid läsning. Två platser:

1. **Historik-preview i Journal** (rad ~280): nuvarande `e.free_text` är råtext men kommer nu innehålla `<p>…</p>`. Ny helper `htmlToPreviewText(html, maxLen=160)` strippar taggar via DOMParser → `textContent`. Används endast för preview.

2. **Veckorapport / liknande** som visar `free_text`: söker upp förekomster (`rg "free_text" src`) och avgör per fall — om fältet visas som rik text ska `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}` användas på en `<div className="ProseMirror">`. Om bara textsammanfattning visas: `htmlToPreviewText`.

## CSS

Lägg till TipTap-stilar (`.ProseMirror` och `.article-content` block med blockquote, listor, headings, länkar, hr) i `src/index.css`, anpassat till Riktnings tokens — länkar i `hsl(var(--orange-start))`, blockquote-border i `hsl(var(--border))`, ingen mörkt-läge-specifik regel (Riktning är ljus-tema).

Bakåtkompatibilitet: gamla `free_text`-poster som är ren text fungerar utan migration — TipTap accepterar plain text som content och visar det som ett `<p>`. Vid spara konverteras allt till HTML; ingen retroaktiv ändring.

## Filer

Nya:
- `src/components/editor/TipTapEditor.tsx`
- `src/components/editor/RichTextToolbar.tsx`
- `src/components/editor/LinkInsertSheet.tsx`
- `src/components/editor/RichTextEditor.tsx`
- `src/lib/htmlText.ts` — `htmlToPreviewText(html, maxLen)` + `sanitizeJournalHtml(html)` (DOMPurify-wrapper).

Modifierade:
- `src/pages/Journal.tsx` — byter `<Textarea>` mot `<RichTextEditor>` i `active === "free"`-grenen (mobil + desktop), använder `htmlToPreviewText` i historik-preview.
- `src/index.css` — TipTap content-stilar.

## Vad som INTE ändras

- Strukturerade mall-fält (Tre rader, Tankeloop, Kropp först, Bevislogg).
- Spara-flödet (samma `journal_entries.free_text`-kolumn).
- Mobilens FAB, BottomNav, ActivityPicker.
- Inga schemaändringar, inga edge functions.

## Risker

- **Mobiltoolbar-positionering**: editor-versionen i källprojektet använder `useKeyboardHeight` för exakt placering över virtual keyboard. Vi förenklar med `position: fixed; bottom: 0` + `env(safe-area-inset-bottom)`. På iOS Safari kan tangentbordet täcka toolbaren delvis. Om det blir problem: porta `useKeyboardHeight`-hooken (visualViewport API) i en uppföljning.
- **HTML i existerande free_text**: Inga befintliga poster har HTML, så ingen migration behövs. Nya poster skrivs som HTML från och med nu.
