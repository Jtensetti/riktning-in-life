import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Strikethrough, Link as LinkIcon, Quote,
  List, ListOrdered, Undo2, ChevronDown, Type, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * RichTextToolbar — context-aware toolbar for the journal editor.
 *
 * Selection mode shows formatting tools; otherwise insertion tools.
 * Trimmed from the source: image actions removed, Swedish copy throughout.
 */

export type ToolbarAction =
  | "bold" | "italic" | "strikethrough"
  | "heading-1" | "heading-2" | "heading-3" | "normal"
  | "link" | "bullet-list" | "numbered-list" | "quote" | "divider"
  | "undo" | "hide-keyboard";

interface RichTextToolbarProps {
  hasSelection: boolean;
  onAction: (action: ToolbarAction) => void;
  isMobile: boolean;
  className?: string;
  onHideKeyboard?: () => void;
}

const preventBlur = (e: React.MouseEvent | React.TouchEvent) => e.preventDefault();

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

const DefaultToolbar = ({
  onAction, onHideKeyboard, isMobile,
}: {
  onAction: (a: ToolbarAction) => void;
  onHideKeyboard?: () => void;
  isMobile: boolean;
}) => {
  const [insertOpen, setInsertOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";
  const buttonSize = isMobile ? "h-11 w-11" : "h-9 w-9";

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

      {isMobile && onHideKeyboard && (
        <Button type="button" variant="ghost" size="sm" onClick={onHideKeyboard}
          className={cn(buttonSize, "p-0 shrink-0")} aria-label="Stäng tangentbord">
          <ChevronDown className={iconSize} />
        </Button>
      )}
    </div>
  );
};

export function RichTextToolbar({
  hasSelection, onAction, isMobile, className, onHideKeyboard,
}: RichTextToolbarProps) {
  return (
    <div className={cn(
      "flex items-center justify-center py-2 px-3",
      !isMobile && "bg-surface-alt/60 border-t border-border-soft",
      className,
    )}>
      <AnimatePresence mode="wait">
        <motion.div
          key={hasSelection ? "selection" : "default"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1 }}
        >
          {hasSelection
            ? <SelectionToolbar onAction={onAction} isMobile={isMobile} />
            : <DefaultToolbar onAction={onAction} onHideKeyboard={onHideKeyboard} isMobile={isMobile} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default RichTextToolbar;
