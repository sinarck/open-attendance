import { formatDistanceToNowStrict } from "date-fns";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { DashboardSummary } from "../../../../../convex/dashboard";

interface AttentionListProps {
  summary: DashboardSummary;
}

export function AttentionList({ summary }: AttentionListProps) {
  if (summary.completedMeetings === 0) {
    return (
      <Empty className="rounded-xl border border-border/60 p-8 md:p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>No attendance history yet</EmptyTitle>
          <EmptyDescription>
            Close a few meetings first. Attendance risk surfaces once there is history to compare.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (summary.membersNeedingAttention.length === 0) {
    return (
      <Empty className="rounded-xl border border-border/60 p-8 md:p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>Everyone is on track</EmptyTitle>
          <EmptyDescription>No attendance gaps detected across closed meetings.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2">
      {summary.membersNeedingAttention.map((member) => (
        <div
          key={member._id}
          className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border"
        >
          <div className="flex items-center gap-3">
            <UserAvatar name={member.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">{member.identifier}</p>
            </div>
            <Badge variant={member.attendanceRate < 60 ? "error" : "warning"} className="shrink-0">
              {member.attendanceRate}%
            </Badge>
          </div>
          <Progress className="mt-3 gap-1" value={member.attendanceRate}>
            <ProgressTrack className="h-1 rounded-full">
              <ProgressIndicator
                className={
                  member.attendanceRate < 60
                    ? "rounded-full bg-destructive"
                    : "rounded-full bg-amber-500"
                }
              />
            </ProgressTrack>
          </Progress>
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{member.attended} present</span>
            <span>{member.excused} excused</span>
            <span>{member.missed} missed</span>
            <span className="ml-auto">
              {member.lastCheckInAt
                ? `Seen ${formatDistanceToNowStrict(member.lastCheckInAt, { addSuffix: true })}`
                : "Never seen"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
