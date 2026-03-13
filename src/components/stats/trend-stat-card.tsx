import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrendStatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
}

export function TrendStatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: TrendStatCardProps) {
  const isUp = trend === "up";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon size={18} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          <span
            className={cn(
              "flex items-center text-sm",
              isUp ? "text-success-foreground" : "text-destructive-foreground",
            )}
          >
            <TrendIcon size={14} />
            {change}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">vs last month</p>
      </CardContent>
    </Card>
  );
}
