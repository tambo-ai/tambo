import { cn } from "@/lib/utils";
import { TabType } from "@/types/tabs";

interface SecondNavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

export function SecondNavbar({
  activeTab,
  onTabChange,
  className,
}: SecondNavbarProps) {
  const items = Object.values(TabType);

  return (
    <nav
      className={cn(
        "bg-background/50 backdrop-blur-sm border border-border/40 rounded-full px-2 py-1.5 w-fit",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = activeTab === item;
        return (
          <button
            key={item}
            onClick={() => onTabChange(item)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-primary/5",
            )}
          >
            {item}
          </button>
        );
      })}
    </nav>
  );
}
