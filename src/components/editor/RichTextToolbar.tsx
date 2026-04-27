import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Strikethrough, Link as LinkIcon, Quote,
  List, ListOrdered, Undo2, Redo2, ChevronDown, Type, Plus,
  Heading1, Heading2, Heading3, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * RichTextToolbar — context-aware toolbar for the journal editor.
 *
 * Mobile keeps its compact, popover-driven layout (selection vs default).
 * Desktop uses a stable, always-visible toolbar with direct buttons and
 * active-state highlighting — selection formatting on desktop happens via
 * the floating BubbleMenu instead of toolbar state-switching.
 */

export type ToolbarAction =
  | "bold" | "italic" | "strikethrough"
  | "heading-1" | "heading-2" | "heading-3" | "normal"
  | "link" | "bullet-list" | "numbered-list" | "quote" | "divider"
  | "undo" | "redo" | "hide-keyboard";

interface RichTextToolbarProps {
  hasSelection: boolean;
  onAction: (action: ToolbarAction) => void;
  isMobile: boolean;
  className?: string;
  onHideKeyboard?: () => void;
  /** Required for desktop active-state lookups. */
  editor?: Editor | null;
}

const preventBlur = (e: React.MouseEvent | React.TouchEvent) => e.preventDefault();

/* ------------------------------ MOBILE (unchanged) ------------------------------ */

const SelectionToolbar = ({
  onAction, isMobile,
}: { onAction: (a: ToolbarAction) => void; isMobile: boolean }) => {
  const [headingOpen, setHeadingOpen] = useState(false);
  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";
  const buttonSize = isMobile ? "h-11 w-11" : "h-9 w-9";

  const headings = [
    { label: "Brödtext", action: "normal" as const },
    { label: "Rubrik 1", action: "heading-1" as const },
    { label: "Rubrik 2", action: "heading-2" as const },
    { label: "Rubrik 3", action: "heading-3" as const },
  ];

  return (
    <div className="flex items-center justify-center gap-0.5 flex-wrap">
      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("bold")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Fet">
        <Bold className={iconSize} strokeWidth={2.5} />
      </Button>
      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("italic")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Kursiv">
        <Italic className={iconSize} />
      </Button>
      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("strikethrough")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Genomstruken">
        <Strikethrough className={iconSize} />
      </Button>

      <div className="w-px h-5 bg-border-soft mx-1.5" />

      <Popover open={headingOpen} onOpenChange={setHeadingOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
            className={cn(buttonSize, "p-0 shrink-0")} aria-label="Textstil">
            <Type className={iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-1" align="center" side="top" sideOffset={8}
          onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
          <div className="flex flex-col">
            {headings.map(({ label, action }) => (
              <Button key={action} type="button" variant="ghost" size="sm"
                onMouseDown={preventBlur} onTouchStart={preventBlur}
                onClick={() => { onAction(action); setHeadingOpen(false); }}
                className="justify-start h-8 text-sm">
                {label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-border-soft mx-1.5" />

      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("link")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Länk">
        <LinkIcon className={iconSize} />
      </Button>
      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("quote")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Citat">
        <Quote className={iconSize} />
      </Button>
    </div>
  );
};

const MobileDefaultToolbar = ({
  onAction, onHideKeyboard,
}: {
  onAction: (a: ToolbarAction) => void;
  onHideKeyboard?: () => void;
}) => {
  const [insertOpen, setInsertOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const iconSize = "h-5 w-5";
  const buttonSize = "h-11 w-11";

  return (
    <div className="flex items-center justify-center gap-0.5 flex-wrap">
      <Popover open={insertOpen} onOpenChange={setInsertOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
            className={cn(buttonSize, "p-0 shrink-0")} aria-label="Infoga">
            <Plus className={iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start" side="top" sideOffset={8}
          onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
          <div className="flex flex-col">
            <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
              onClick={() => { onAction("divider"); setInsertOpen(false); }} className="justify-start h-8 text-sm">
              Avdelare
            </Button>
            <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
              onClick={() => { onAction("quote"); setInsertOpen(false); }} className="justify-start h-8 text-sm">
              Citat
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("link")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Länk">
        <LinkIcon className={iconSize} />
      </Button>

      <Popover open={listOpen} onOpenChange={setListOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
            className={cn(buttonSize, "p-0 shrink-0")} aria-label="Listor">
            <List className={iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="center" side="top" sideOffset={8}
          onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
          <div className="flex flex-col">
            <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
              onClick={() => { onAction("bullet-list"); setListOpen(false); }}
              className="justify-start h-8 text-sm gap-2">
              <List className="h-4 w-4" /> Punktlista
            </Button>
            <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
              onClick={() => { onAction("numbered-list"); setListOpen(false); }}
              className="justify-start h-8 text-sm gap-2">
              <ListOrdered className="h-4 w-4" /> Numrerad lista
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button type="button" variant="ghost" size="sm" onMouseDown={preventBlur} onTouchStart={preventBlur}
        onClick={() => onAction("undo")} className={cn(buttonSize, "p-0 shrink-0")} aria-label="Ångra">
        <Undo2 className={iconSize} />
      </Button>

      {onHideKeyboard && (
        <Button type="button" variant="ghost" size="sm" onClick={onHideKeyboard}
          className={cn(buttonSize, "p-0 shrink-0")} aria-label="Stäng tangentbord">
          <ChevronDown className={iconSize} />
        </Button>
      )}
    </div>
  );
};

/* ------------------------------ DESKTOP ------------------------------ */

interface DesktopBtnProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  shortcut?: string;
  children: React.ReactNode;
}

const DesktopBtn = ({ label, active, disabled, onClick, shortcut, children }: DesktopBtnProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    disabled={disabled}
    onMouseDown={preventBlur}
    onTouchStart={preventBlur}
    onClick={onClick}
    title={shortcut ? `${label} (${shortcut})` : label}
    aria-label={label}
    aria-pressed={active}
    className={cn(
      "h-9 w-9 p-0 shrink-0 text-text-secondary hover:text-foreground hover:bg-surface-alt",
      active && "bg-surface-alt text-foreground",
      disabled && "opacity-40",
    )}
  >
    {children}
  </Button>
);

const Divider = () => <div className="w-px h-5 bg-border-soft mx-1" />;

const DesktopToolbar = ({
  editor, onAction,
}: { editor: Editor | null; onAction: (a: ToolbarAction) => void }) => {
  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false;
  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;
  const mod = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <DesktopBtn label="Fet" shortcut={`${mod}+B`} active={isActive("bold")} onClick={() => onAction("bold")}>
        <Bold className="h-4 w-4" strokeWidth={2.5} />
      </DesktopBtn>
      <DesktopBtn label="Kursiv" shortcut={`${mod}+I`} active={isActive("italic")} onClick={() => onAction("italic")}>
        <Italic className="h-4 w-4" />
      </DesktopBtn>

      <Divider />

      <DesktopBtn label="Rubrik 1" active={isActive("heading", { level: 1 })} onClick={() => onAction("heading-1")}>
        <Heading1 className="h-4 w-4" />
      </DesktopBtn>
      <DesktopBtn label="Rubrik 2" active={isActive("heading", { level: 2 })} onClick={() => onAction("heading-2")}>
        <Heading2 className="h-4 w-4" />
      </DesktopBtn>
      <DesktopBtn label="Rubrik 3" active={isActive("heading", { level: 3 })} onClick={() => onAction("heading-3")}>
        <Heading3 className="h-4 w-4" />
      </DesktopBtn>

      <Divider />

      <DesktopBtn label="Punktlista" active={isActive("bulletList")} onClick={() => onAction("bullet-list")}>
        <List className="h-4 w-4" />
      </DesktopBtn>
      <DesktopBtn label="Numrerad lista" active={isActive("orderedList")} onClick={() => onAction("numbered-list")}>
        <ListOrdered className="h-4 w-4" />
      </DesktopBtn>
      <DesktopBtn label="Citat" active={isActive("blockquote")} onClick={() => onAction("quote")}>
        <Quote className="h-4 w-4" />
      </DesktopBtn>

      <Divider />

      <DesktopBtn label="Länk" shortcut={`${mod}+K`} active={isActive("link")} onClick={() => onAction("link")}>
        <LinkIcon className="h-4 w-4" />
      </DesktopBtn>
      <DesktopBtn label="Avdelare" onClick={() => onAction("divider")}>
        <Minus className="h-4 w-4" />
      </DesktopBtn>

      <Divider />

      <DesktopBtn label="Ångra" shortcut={`${mod}+Z`} disabled={!canUndo} onClick={() => onAction("undo")}>
        <Undo2 className="h-4 w-4" />
      </DesktopBtn>
      <DesktopBtn label="Gör om" shortcut={`${mod}+⇧+Z`} disabled={!canRedo} onClick={() => onAction("redo")}>
        <Redo2 className="h-4 w-4" />
      </DesktopBtn>
    </div>
  );
};

export function RichTextToolbar({
  hasSelection, onAction, isMobile, className, onHideKeyboard, editor,
}: RichTextToolbarProps) {
  // Desktop: stable toolbar, no mode-switching.
  if (!isMobile) {
    return (
      <div
        className={cn(
          "flex items-center py-1.5 px-2",
          "bg-surface-alt/60 border-b border-border-soft",
          className,
        )}
      >
        <DesktopToolbar editor={editor ?? null} onAction={onAction} />
      </div>
    );
  }

  // Mobile: keep the previous animated default/selection split.
  return (
    <div className={cn("flex items-center justify-center py-2 px-3", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={hasSelection ? "selection" : "default"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1 }}
        >
          {hasSelection
            ? <SelectionToolbar onAction={onAction} isMobile />
            : <MobileDefaultToolbar onAction={onAction} onHideKeyboard={onHideKeyboard} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default RichTextToolbar;
