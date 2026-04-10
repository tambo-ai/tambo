import { cn } from "@/lib/utils";
import { Label } from "./label";

interface SettingsRowProps {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={cn("flex items-center justify-between gap-4 py-4", className)}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <Label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
