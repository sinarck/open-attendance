import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Session } from "@/config";
import { formatAttendance, isUpcoming } from "@/lib/attendance";

interface SessionRowProps {
  session: Session;
  showActions?: boolean;
}

export function SessionRow({ session, showActions = false }: SessionRowProps) {
  const upcoming = isUpcoming(session.status);

  return (
    <TableRow>
      <TableCell className="font-medium">{session.name}</TableCell>
      <TableCell>{session.date}</TableCell>
      <TableCell>
        {upcoming ? "—" : formatAttendance(session.present, session.total)}
      </TableCell>
      <TableCell>
        <Badge variant={upcoming ? "outline" : "success"}>
          {upcoming ? "Upcoming" : "Done"}
        </Badge>
      </TableCell>
      {showActions && (
        <TableCell className="text-right">
          <Button size="sm" variant="ghost" render={<Link href="/dashboard" />}>
            {upcoming ? "Take Attendance" : "View"}
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
