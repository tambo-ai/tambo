import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { Check, Copy } from "lucide-react";

interface CommandCopyButtonProps {
  command: string;
  className?: string;
}

export function CommandCopyButton({
  command,
  className,
}: CommandCopyButtonProps) {
  const [copied, copy] = useClipboard(command);

  return (
    <div className="bg-muted p-3 rounded-lg">
      <div className="flex items-center justify-between">
        <code className="text-sm font-mono">{command}</code>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => await copy()}
          className={className}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
