import { useState, useCallback, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RichTextToolbar, type ToolbarAction } from "./RichTextToolbar";
import { TipTapEditor, type TipTapEditorHandle } from "./TipTapEditor";
import { LinkInsertSheet } from "./LinkInsertSheet";
import { cn } from "@/lib/utils";

/**
 * RichTextEditor — orchestrates TipTap + toolbar + link sheet for Riktning.
 *
 * - No image upload (Riktning has no storage bucket for journal images).
 * - On mobile the toolbar floats fixed at viewport bottom while focused;
 *   on desktop it sits statically beneath the editor.
 * - Cmd/Ctrl+Enter triggers the optional `onSubmit` callback so parents
 *   can wire up "save".
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
  const isMobile = useIsMobile();
  const editorRef = useRef<TipTapEditorHandle>(null);

  const getEditor = useCallback(() => editorRef.current, []);

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
      case "link": setShowLinkSheet(true); break;
      case "quote": editor.toggleBlockquote(); break;
      case "bullet-list": editor.toggleBulletList(); break;
      case "numbered-list": editor.toggleOrderedList(); break;
      case "divider": editor.insertHorizontalRule(); break;
      case "undo": editor.undo(); break;
      case "hide-keyboard": editor.hideKeyboard(); break;
    }
  }, [getEditor]);

  const handleLinkInsert = useCallback((url: string) => {
    getEditor()?.setLink(url);
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

  const onKeyDown: React.KeyboardEventHandler = e => {
    if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const showToolbar = isMobile ? isFocused : true;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden bg-surface border border-border-soft relative",
        className,
      )}
      onKeyDown={onKeyDown}
    >
      <TipTapEditor
        ref={editorRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
        className={cn(isMobile && showToolbar && "pb-16")}
      />

      {isMobile && showToolbar && (
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

      {!isMobile && (
        <RichTextToolbar
          hasSelection={hasSelection}
          onAction={handleAction}
          isMobile={false}
          onHideKeyboard={handleHideKeyboard}
        />
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
