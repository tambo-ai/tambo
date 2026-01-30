import { z } from "zod";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const StatsCardSchema = z.object({
  title: z.string().describe("The title of the stat card"),
  value: z
    .union([z.string(), z.number()])
    .describe("The main value to display"),
  change: z
    .number()
    .optional()
    .describe("Percentage change (positive or negative)"),
  subtitle: z.string().optional().describe("Optional subtitle or description"),
  variant: z
    .enum(["default", "primary", "success", "warning", "danger"])
    .optional()
    .describe("Color variant"),
});

type StatsCardProps = z.infer<typeof StatsCardSchema>;

export const StatsCard = ({
  title,
  value,
  change,
  subtitle,
  variant = "default",
}: StatsCardProps) => {
  const variantStyles = {
    default: "border-border bg-card",
    primary: "border-primary/30 bg-primary/5",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    danger: "border-red-500/30 bg-red-500/5",
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0)
      return <Minus className="w-4 h-4" />;
    return change > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div
      className={`p-6 border-2 rounded-lg transition-all hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        {change !== undefined && (
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}
          >
            {getTrendIcon()}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
};
