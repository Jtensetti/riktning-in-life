import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

/**
 * TipTapEditor — slim WYSIWYG core for Riktning's journal.
 *
 * Adapted from the fediverse-career-newest article editor, trimmed to omit
 * image support (Riktning has no image storage bucket today) and to follow
 * Riktning's design tokens. Headings limited to H1–H3 — five levels felt
 * heavy for a journaling tone.
 */

export interface TipTapEditorHandle {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  setHeading: (level: 1 | 2 | 3) => void;
  clearHeading: () => void;
  toggleBlockquote: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  setLink: (url: string, text?: string) => void;
  unsetLink: () => void;
  insertHorizontalRule: () => void;
  undo: () => void;
  redo: () => void;
  hideKeyboard: () => void;
  getSelectedText: () => string;
  isEmpty: () => boolean;
  /** Direct access for active-state lookups in toolbars / bubble menus. */
  getEditor: () => Editor | null;
}

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  /** Called on every transaction so parent can re-render for active states. */
  onTransaction?: () => void;
  onEditorReady?: (editor: Editor) => void;
  minHeight?: number;
}

export const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(function TipTapEditor(
  {
    value,
    onChange,
    placeholder = "Skriv vad du vill…",
    className,
    onFocus,
    onBlur,
    onSelectionChange,
    onTransaction,
    onEditorReady,
    minHeight = 220,
  },
  ref,
) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-orange-start underline cursor-pointer",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "ProseMirror focus:outline-none",
          "p-4 text-base leading-relaxed",
        ),
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      if (!isUpdatingRef.current) {
        onChange(editor.getHTML());
      }
    },
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      onSelectionChange?.(from !== to);
    },
    onTransaction: () => onTransaction?.(),
  });

  useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value || "");
      isUpdatingRef.current = false;
    }
  }, [value, editor]);

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const setHeading = useCallback(
    (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run(),
    [editor],
  );
  const clearHeading = useCallback(() => editor?.chain().focus().setParagraph().run(), [editor]);
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const setLink = useCallback(
    (url: string, text?: string) => {
      if (!editor) return;
      if (!url) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      if (text && !hasSelection) {
        // No selection → insert a new linked text node.
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text,
            marks: [{ type: "link", attrs: { href: url } }],
          })
          .run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }
    },
    [editor],
  );
  const unsetLink = useCallback(
    () => editor?.chain().focus().extendMarkRange("link").unsetLink().run(),
    [editor],
  );
  const insertHorizontalRule = useCallback(() => editor?.chain().focus().setHorizontalRule().run(), [editor]);
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);
  const hideKeyboard = useCallback(() => editor?.commands.blur(), [editor]);

  useImperativeHandle(
    ref,
    () => ({
      toggleBold, toggleItalic, toggleStrike, setHeading, clearHeading,
      toggleBlockquote, toggleBulletList, toggleOrderedList, setLink, unsetLink,
      insertHorizontalRule, undo, redo, hideKeyboard,
      getSelectedText: () => {
        if (!editor) return "";
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, " ");
      },
      isEmpty: () => editor?.isEmpty ?? true,
      getEditor: () => editor ?? null,
    }),
    [editor, toggleBold, toggleItalic, toggleStrike, setHeading, clearHeading,
      toggleBlockquote, toggleBulletList, toggleOrderedList, setLink, unsetLink,
      insertHorizontalRule, undo, redo, hideKeyboard],
  );

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "flex-1 overflow-auto",
        "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        "[&_.is-editor-empty:first-child]:before:text-text-secondary/80",
        "[&_.is-editor-empty:first-child]:before:float-left",
        "[&_.is-editor-empty:first-child]:before:h-0",
        "[&_.is-editor-empty:first-child]:before:pointer-events-none",
        className,
      )}
    />
  );
});

export default TipTapEditor;
