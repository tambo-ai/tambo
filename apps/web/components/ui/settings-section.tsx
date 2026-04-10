import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  cardClassName?: string;
  /** Rendered top-right of the section header, next to the title. Use for EditWithTamboButton or other actions. */
  action?: React.ReactNode;
  /** When false, renders children directly without a Card wrapper. Useful for full-width content like textareas. Defaults to true. */
  bordered?: boolean;
  /** When true, adds dividing lines between children. Only applies if bordered is true. Defaults to false. */
  divided?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  cardClassName,
  action,
  bordered = true,
  divided = true,
}: SettingsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold font-sans">{title}</h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
      )}
      {bordered ? (
        <Card className={cn(cardClassName)}>
          <CardContent
            className={cn(`px-6 py-2`, divided && "divide-y divide-border")}
          >
            {children}
          </CardContent>
        </Card>
      ) : (
        children
      )}
    </div>
  );
}
