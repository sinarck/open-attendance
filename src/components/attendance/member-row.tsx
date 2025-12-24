import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Member } from "@/config";
import { getAttendanceBadge } from "@/lib/attendance";

interface MemberRowProps {
  member: Member;
}

export function MemberRow({ member }: MemberRowProps) {
  const badge = getAttendanceBadge(member.rate);

  return (
    <TableRow>
      <TableCell className="font-medium">{member.name}</TableCell>
      <TableCell className="text-muted-foreground">{member.email}</TableCell>
      <TableCell>{member.rate}%</TableCell>
      <TableCell>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{member.lastSeen}</TableCell>
    </TableRow>
  );
}
