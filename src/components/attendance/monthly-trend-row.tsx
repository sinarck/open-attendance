import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { MonthlyTrend } from "@/config";

interface MonthlyTrendRowProps {
  data: MonthlyTrend;
}

export function MonthlyTrendRow({ data }: MonthlyTrendRowProps) {
  const isGood = data.avgAttendance >= 85;

  return (
    <TableRow>
      <TableCell className="font-medium">{data.month}</TableCell>
      <TableCell>{data.sessions}</TableCell>
      <TableCell>
        <Badge variant={isGood ? "success" : "warning"}>
          {data.avgAttendance}%
        </Badge>
      </TableCell>
    </TableRow>
  );
}
