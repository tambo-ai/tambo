import { cn } from "@/lib/utils";
import { ShowcaseSection as ShowcaseSectionType } from "@/types/showcase";

interface ShowcaseSectionProps {
  section: ShowcaseSectionType;
  className?: string;
}

export function ShowcaseSection({ section, className }: ShowcaseSectionProps) {
  return (
    <div className={cn("w-full max-w-screen-lg space-y-8", className)}>
      <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
      <div className="grid grid-cols-1 gap-8">
        {section.items.map((item, index) => (
          <div key={index} className="rounded-lg bg-card p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-medium">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
              <div className="mt-4 rounded-md bg-muted p-4">
                <code className="text-sm font-mono text-muted-foreground">
                  {item.installCommand}
                </code>
              </div>
            </div>
            <div className="rounded-lg bg-background p-6">{item.component}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
