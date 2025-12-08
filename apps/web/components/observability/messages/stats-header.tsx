import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ChevronDown,
  MessageSquare,
  Monitor,
  Settings,
} from "lucide-react";
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

// StatCard

interface StatCardProps {
  count: number;
  label: string;
  items: MessageItem[];
  onItemClick: (messageId: string) => void;
  isCondensed?: boolean;
}

const StatCard = memo(
  ({
    count,
    label,
    items,
    onItemClick,
    isCondensed = false,
  }: StatCardProps) => {
    const getIcon = () => {
      switch (label.toLowerCase()) {
        case "messages":
          return <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />;
        case "components":
          return <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />;
        case "errors":
          return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
        case "tools":
          return <Settings className="h-3 w-3 sm:h-4 sm:w-4" />;
        default:
          return null;
      }
    };

    return (
      <Card
        className={cn(
          "overflow-hidden",
          isCondensed && "shadow-none border border-border",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full flex items-center justify-between hover:bg-muted/50",
                isCondensed ? "h-10 p-2" : "p-2 sm:p-4 h-auto",
                count === 0 && "opacity-50",
              )}
              disabled={count === 0}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {isCondensed ? (
                  <>
                    {getIcon()}
                    <span className="text-sm font-semibold">{count}</span>
                    <span className="text-xs text-foreground hidden sm:inline">
                      {label}
                    </span>
                  </>
                ) : (
                  <div className="text-left">
                    <div className="text-lg sm:text-2xl font-bold">{count}</div>
                    <div className="text-xs sm:text-sm text-foreground">
                      {label}
                    </div>
                  </div>
                )}
              </div>

              {count > 0 && (
                <div className="text-foreground">
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72 sm:w-80 max-h-64 sm:max-h-80 overflow-y-auto"
            align="start"
            side="bottom"
          >
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="cursor-pointer p-2 sm:p-3 focus:bg-muted/50"
                onClick={() => onItemClick(item.messageId)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm truncate">
                    {item.title}
                  </div>
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
    );
  },
);
StatCard.displayName = "StatCard";

// StatsHeader

interface StatsHeaderProps {
  stats: ThreadStats;
  messageItems: MessageItem[];
  componentItems: MessageItem[];
  errorItems: MessageItem[];
  toolItems: MessageItem[];
  onScrollToMessage: (messageId: string) => void;
  isCondensed?: boolean;
}

export const StatsHeader = memo(
  ({
    stats,
    messageItems,
    componentItems,
    errorItems,
    toolItems,
    onScrollToMessage,
    isCondensed = false,
  }: StatsHeaderProps) => (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4",
        isCondensed && "bg-background/95 backdrop-blur-sm p-2",
      )}
    >
      <StatCard
        count={stats.messages}
        label="Messages"
        items={messageItems}
        onItemClick={onScrollToMessage}
        isCondensed={isCondensed}
      />
      <StatCard
        count={stats.components}
        label="Components"
        items={componentItems}
        onItemClick={onScrollToMessage}
        isCondensed={isCondensed}
      />
      <StatCard
        count={stats.errors}
        label="Errors"
        items={errorItems}
        onItemClick={onScrollToMessage}
        isCondensed={isCondensed}
      />
      <StatCard
        count={stats.tools}
        label="Tools"
        items={toolItems}
        onItemClick={onScrollToMessage}
        isCondensed={isCondensed}
      />
    </div>
  ),
);
StatsHeader.displayName = "StatsHeader";
