import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Session } from "@/config";
import { calculateAttendanceRate, formatAttendance } from "@/lib/attendance";

interface SessionHistoryRowProps {
  session: Session;
}

export function SessionHistoryRow({ session }: SessionHistoryRowProps) {
  const rate = calculateAttendanceRate(session.present, session.total);
  const isGood = rate >= 85;

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{session.name}</div>
          <div className="text-xs text-muted-foreground">{session.date}</div>
        </div>
      </TableCell>
      <TableCell>{formatAttendance(session.present, session.total)}</TableCell>
      <TableCell>
        <Badge variant={isGood ? "success" : "warning"}>{rate}%</Badge>
      </TableCell>
    </TableRow>
  );
}
