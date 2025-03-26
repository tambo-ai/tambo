import { cn } from "@/lib/utils";
import { ShowcaseSection as ShowcaseSectionType } from "@/types/showcase";
import { CLI } from "./cli";

interface ShowcaseSectionProps {
  section: ShowcaseSectionType;
  className?: string;
}

export function ShowcaseSection({ section, className }: ShowcaseSectionProps) {
  return (
    <div className={cn("w-full container mx-auto px-4 mt-8", className)}>
      <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {section.items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "rounded-lg bg-card p-6 space-y-6",
              index === 2 && "md:col-span-2",
            )}
          >
            <div className="space-y-2">
              <h3 className="text-xl font-medium">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
              <div className="mt-4 rounded-md p-4">
                <CLI command={item.installCommand} />
              </div>
            </div>
            <div className="rounded-lg bg-background p-6">{item.component}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
