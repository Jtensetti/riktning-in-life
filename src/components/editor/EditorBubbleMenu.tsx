import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Strikethrough, Link as LinkIcon,
  Heading2, Quote, ExternalLink, Pencil, Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EditorBubbleMenu — Notion/Medium-style floating toolbar that appears
 * above a text selection on desktop. Two modes:
 *   - text selection (no link): formatting actions
 *   - cursor inside a link: open / edit / remove
 */

interface EditorBubbleMenuProps {
  editor: Editor | null;
  onEditLink: () => void;
}

const preventBlur = (e: React.MouseEvent | React.TouchEvent) => e.preventDefault();

export function EditorBubbleMenu({ editor, onEditLink }: EditorBubbleMenuProps) {
  if (!editor) return null;

  const isLinkActive = editor.isActive("link");
  const linkHref = (editor.getAttributes("link") as { href?: string }).href ?? "";

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor, from, to }) => {
        if (!editor.isEditable) return false;
        if (editor.isActive("link")) return true;
        return from !== to;
      }}
      className="z-50"
    >
      <div className="flex items-center gap-0.5 rounded-xl border border-border-soft bg-surface px-1 py-1 shadow-lg">
        {isLinkActive ? (
          <>
            {linkHref && (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={preventBlur}
                className="flex items-center gap-1.5 px-2 h-8 rounded-md text-xs text-text-secondary hover:bg-surface-alt max-w-[180px]"
                title={linkHref}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{linkHref.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            <div className="w-px h-5 bg-border-soft mx-1" />
            <BubbleBtn label="Redigera länk" onClick={onEditLink}>
              <Pencil className="h-3.5 w-3.5" />
            </BubbleBtn>
            <BubbleBtn
              label="Ta bort länk"
              onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
            >
              <Unlink className="h-3.5 w-3.5" />
            </BubbleBtn>
          </>
        ) : (
          <>
            <BubbleBtn
              label="Fet"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3.5 w-3.5" strokeWidth={2.5} />
            </BubbleBtn>
            <BubbleBtn
              label="Kursiv"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3.5 w-3.5" />
            </BubbleBtn>
            <BubbleBtn
              label="Genomstruken"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </BubbleBtn>
            <div className="w-px h-5 bg-border-soft mx-1" />
            <BubbleBtn
              label="Rubrik"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </BubbleBtn>
            <BubbleBtn
              label="Citat"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-3.5 w-3.5" />
            </BubbleBtn>
            <BubbleBtn label="Länk" onClick={onEditLink}>
              <LinkIcon className="h-3.5 w-3.5" />
            </BubbleBtn>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}

function BubbleBtn({
  active, label, onClick, children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      onMouseDown={preventBlur}
      onTouchStart={preventBlur}
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0 shrink-0 text-text-secondary hover:text-foreground",
        active && "bg-surface-alt text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

export default EditorBubbleMenu;
