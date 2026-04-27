import DOMPurify from "dompurify";

/**
 * HTML helpers for journal rich-text content.
 *
 * The journal stores TipTap output as HTML in `journal_entries.free_text`.
 * - When showing a *preview* (truncated, plain text), strip tags via
 *   DOMParser so we don't render arbitrary markup in tight UI cards.
 * - When *rendering* the full entry, sanitize with DOMPurify and inject
 *   into a `.ProseMirror`-styled container.
 */

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*?>/i.test(s);

export function htmlToPreviewText(input: string | null | undefined, maxLen = 160): string {
  if (!input) return "";
  let text = input;
  if (looksLikeHtml(input) && typeof window !== "undefined" && "DOMParser" in window) {
    try {
      const doc = new DOMParser().parseFromString(input, "text/html");
      text = doc.body.textContent || "";
    } catch {
      text = input.replace(/<[^>]*>/g, " ");
    }
  }
  text = text.replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

/**
 * Sanitize HTML for safe rendering inside a .ProseMirror container.
 * Allows the inline + block tags TipTap emits with our extension set.
 */
export function sanitizeJournalHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "s", "u",
      "h1", "h2", "h3",
      "ul", "ol", "li",
      "blockquote", "hr",
      "a", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "rel", "target", "class"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
