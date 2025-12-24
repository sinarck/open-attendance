import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TrendStatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: IconSvgElement;
}

export function TrendStatCard({
  title,
  value,
  change,
  trend,
  icon,
}: TrendStatCardProps) {
  const isUp = trend === "up";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <HugeiconsIcon
          icon={icon}
          size={18}
          className="text-muted-foreground"
        />
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
            <HugeiconsIcon
              icon={isUp ? ArrowUp01Icon : ArrowDown01Icon}
              size={14}
            />
            {change}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">vs last month</p>
      </CardContent>
    </Card>
  );
}
