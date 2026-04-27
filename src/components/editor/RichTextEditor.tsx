import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RichTextToolbar, type ToolbarAction } from "./RichTextToolbar";
import { TipTapEditor, type TipTapEditorHandle } from "./TipTapEditor";
import { LinkInsertSheet } from "./LinkInsertSheet";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { cn } from "@/lib/utils";

/**
 * RichTextEditor — orchestrates TipTap + toolbar + link sheet for Riktning.
 *
 * Desktop:
 *   - Stable toolbar at the TOP with direct buttons and active states.
 *   - Floating BubbleMenu shows formatting actions over selections, and
 *     open/edit/remove actions when the cursor sits inside a link.
 *   - Cmd/Ctrl+K opens the link popover; Cmd/Ctrl+Enter submits.
 *
 * Mobile (unchanged):
 *   - Compact toolbar fixed to the viewport bottom while focused, with the
 *     same default/selection mode-switch as before.
 */

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  onSubmit?: () => void;
}

export function RichTextEditor({
  value, onChange, placeholder, className, minHeight, onSubmit,
}: RichTextEditorProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, forceTick] = useState(0);
  const isMobile = useIsMobile();
  const editorRef = useRef<TipTapEditorHandle>(null);
  const editorInstanceRef = useRef<Editor | null>(null);

  const getEditor = useCallback(() => editorRef.current, []);

  const openLinkEditor = useCallback(() => setShowLinkSheet(true), []);

  const handleAction = useCallback((action: ToolbarAction) => {
    const editor = getEditor();
    if (!editor) return;
    switch (action) {
      case "bold": editor.toggleBold(); break;
      case "italic": editor.toggleItalic(); break;
      case "strikethrough": editor.toggleStrike(); break;
      case "normal": editor.clearHeading(); break;
      case "heading-1": editor.setHeading(1); break;
      case "heading-2": editor.setHeading(2); break;
      case "heading-3": editor.setHeading(3); break;
      case "link": openLinkEditor(); break;
      case "quote": editor.toggleBlockquote(); break;
      case "bullet-list": editor.toggleBulletList(); break;
      case "numbered-list": editor.toggleOrderedList(); break;
      case "divider": editor.insertHorizontalRule(); break;
      case "undo": editor.undo(); break;
      case "redo": editor.redo(); break;
      case "hide-keyboard": editor.hideKeyboard(); break;
    }
  }, [getEditor, openLinkEditor]);

  const handleLinkInsert = useCallback((url: string, text?: string) => {
    getEditor()?.setLink(url, text);
    setShowLinkSheet(false);
  }, [getEditor]);

  const blurTimerRef = useRef<number | null>(null);
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => {
    if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => setIsFocused(false), 150);
  }, []);

  useEffect(() => () => {
    if (blurTimerRef.current !== null) window.clearTimeout(blurTimerRef.current);
  }, []);

  const handleSelectionChange = useCallback((s: boolean) => setHasSelection(s), []);
  const handleHideKeyboard = useCallback(() => getEditor()?.hideKeyboard(), [getEditor]);
  const getSelectedText = useCallback(() => getEditor()?.getSelectedText() || "", [getEditor]);

  // Re-render toolbar on every editor transaction so active states stay live.
  const handleTransaction = useCallback(() => forceTick(t => (t + 1) % 1_000_000), []);
  const handleEditorReady = useCallback((editor: Editor) => {
    editorInstanceRef.current = editor;
    forceTick(t => (t + 1) % 1_000_000);
  }, []);

  const onKeyDown: React.KeyboardEventHandler = e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (mod && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      openLinkEditor();
    }
  };

  const showMobileToolbar = isMobile && isFocused;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden bg-surface border border-border-soft relative",
        className,
      )}
      onKeyDown={onKeyDown}
    >
      {/* Desktop: toolbar on top. */}
      {!isMobile && (
        <RichTextToolbar
          hasSelection={hasSelection}
          onAction={handleAction}
          isMobile={false}
          editor={editorInstanceRef.current}
        />
      )}

      <TipTapEditor
        ref={editorRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
        onTransaction={handleTransaction}
        onEditorReady={handleEditorReady}
        className={cn(showMobileToolbar && "pb-16")}
      />

      {/* Desktop bubble menu over selections / links. */}
      {!isMobile && (
        <EditorBubbleMenu
          editor={editorInstanceRef.current}
          onEditLink={openLinkEditor}
        />
      )}

      {/* Mobile: floating bottom toolbar while focused. */}
      {showMobileToolbar && (
        <div
          className="fixed left-0 right-0 bottom-0 z-50 bg-background/98 backdrop-blur-md border-t border-border-soft shadow-[0_-2px_10px_rgba(0,0,0,0.10)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <RichTextToolbar
            hasSelection={hasSelection}
            onAction={handleAction}
            isMobile
            onHideKeyboard={handleHideKeyboard}
          />
        </div>
      )}

      <LinkInsertSheet
        open={showLinkSheet}
        onOpenChange={setShowLinkSheet}
        onInsert={handleLinkInsert}
        selectedText={getSelectedText()}
      />
    </div>
  );
}

export default RichTextEditor;
