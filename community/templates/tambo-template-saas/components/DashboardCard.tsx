import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DashboardCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
}

export default function DashboardCard({
    title,
    value,
    description,
    trend = "neutral",
    trendValue,
}: DashboardCardProps) {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor =
        trend === "up"
            ? "text-success"
            : trend === "down"
                ? "text-danger"
                : "text-muted-foreground";

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold text-card-foreground">{value}</p>
                </div>
                {trendValue && (
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{trendValue}</span>
                    </div>
                )}
            </div>
            {description && (
                <p className="mt-3 text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
