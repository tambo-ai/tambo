import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { memo } from "react";

export interface MessageItem {
  id: string;
  type: "message" | "component" | "error" | "tool";
  title: string;
  subtitle?: string;
  messageId: string;
}

export interface ThreadStats {
  messages: number;
  components: number;
  errors: number;
  tools: number;
}

interface StatCardProps {
  count: number;
  label: string;
  items: MessageItem[];
  sectionKey: string;
  isOpen: boolean;
  onToggle: () => void;
  onItemClick: (messageId: string) => void;
}

const StatCard = memo(({ count, label, items, onItemClick }: StatCardProps) => (
  <Card className="overflow-hidden">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full p-4 h-auto flex items-center justify-between hover:bg-muted/50",
            count === 0 && "opacity-50",
          )}
          disabled={count === 0}
        >
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-foreground">{label}</div>
            </div>
          </div>
          {count > 0 && (
            <div className="text-foreground">
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-80 overflow-y-auto"
        align="start"
        side="bottom"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="cursor-pointer p-3 focus:bg-muted/50"
            onClick={() => onItemClick(item.messageId)}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{item.title}</div>
              {item.subtitle && (
                <div className="text-xs text-foreground truncate mt-1">
                  {item.subtitle}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </Card>
));
StatCard.displayName = "StatCard";

interface StatsHeaderProps {
  stats: ThreadStats;
  messageItems: MessageItem[];
  componentItems: MessageItem[];
  errorItems: MessageItem[];
  toolItems: MessageItem[];
  openSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onScrollToMessage: (messageId: string) => void;
}

export const StatsHeader = memo(
  ({
    stats,
    messageItems,
    componentItems,
    errorItems,
    toolItems,
    openSections,
    onToggleSection,
    onScrollToMessage,
  }: StatsHeaderProps) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        count={stats.messages}
        label="Messages"
        items={messageItems}
        sectionKey="messages"
        isOpen={openSections.messages || false}
        onToggle={() => onToggleSection("messages")}
        onItemClick={onScrollToMessage}
      />
      <StatCard
        count={stats.components}
        label="Components"
        items={componentItems}
        sectionKey="components"
        isOpen={openSections.components || false}
        onToggle={() => onToggleSection("components")}
        onItemClick={onScrollToMessage}
      />
      <StatCard
        count={stats.errors}
        label="Errors"
        items={errorItems}
        sectionKey="errors"
        isOpen={openSections.errors || false}
        onToggle={() => onToggleSection("errors")}
        onItemClick={onScrollToMessage}
      />
      <StatCard
        count={stats.tools}
        label="Tools"
        items={toolItems}
        sectionKey="tools"
        isOpen={openSections.tools || false}
        onToggle={() => onToggleSection("tools")}
        onItemClick={onScrollToMessage}
      />
    </div>
  ),
);
StatsHeader.displayName = "StatsHeader";
