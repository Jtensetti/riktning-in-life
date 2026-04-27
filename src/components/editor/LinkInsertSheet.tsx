import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link as LinkIcon } from "lucide-react";

/**
 * LinkInsertSheet — bottom sheet on mobile, popover on desktop. Trimmed
 * Swedish copy, no i18n dependency.
 */

interface LinkInsertSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, text?: string) => void;
  selectedText?: string;
  trigger?: React.ReactNode;
}

export function LinkInsertSheet({
  open, onOpenChange, onInsert, selectedText = "", trigger,
}: LinkInsertSheetProps) {
  const isMobile = useIsMobile();
  const [url, setUrl] = useState("");
  const [text, setText] = useState(selectedText);

  useEffect(() => { if (open) setText(selectedText); }, [open, selectedText]);

  const handleInsert = () => {
    if (!url) return;
    onInsert(url, text || undefined);
    setUrl("");
    setText("");
    onOpenChange(false);
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link-url">Länkadress</Label>
        <Input
          id="link-url" type="url" placeholder="https://…"
          value={url} onChange={e => setUrl(e.target.value)} autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-text">Visad text (valfritt)</Label>
        <Input
          id="link-text" type="text" placeholder="Lämna tomt för att använda markeringen"
          value={text} onChange={e => setText(e.target.value)}
        />
      </div>
      <Button onClick={handleInsert} disabled={!url} className="w-full">
        Infoga länk
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger}
        <SheetContent side="bottom" className="pb-safe">
          <SheetHeader><SheetTitle>Infoga länk</SheetTitle></SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger}
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Infoga länk
          </h4>
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LinkInsertSheet;
