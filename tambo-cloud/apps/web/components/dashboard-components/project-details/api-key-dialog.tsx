import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useClipboard } from "@/hooks/use-clipboard";
import { Check, Copy } from "lucide-react";

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
}

export function APIKeyDialog({
  open,
  onOpenChange,
  apiKey,
}: APIKeyDialogProps) {
  const [copied, copy] = useClipboard(apiKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your New API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            readOnly
            value={apiKey}
            className="font-mono text-sm bg-white dark:bg-gray-800"
          />
          <p className="text-xs font-sans text-foreground">
            Make sure to copy this key now. You won&apos;t be able to see it
            again!
          </p>
        </div>
        <DialogFooter className="mt-4">
          <Button className="w-full font-sans" onClick={copy}>
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                Copy API Key
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
