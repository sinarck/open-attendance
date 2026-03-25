import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { DashboardSummary } from "../../../../../convex/dashboard";

interface AttentionListProps {
  summary: DashboardSummary;
}

export function AttentionList({ summary }: AttentionListProps) {
  if (summary.completedMeetings === 0) {
    return (
      <EmptyState message="Close a few meetings first. Attendance risk surfaces once there is history to compare." />
    );
  }

  if (summary.membersNeedingAttention.length === 0) {
    return (
      <EmptyState message="Everyone is on track. No attendance gaps detected across closed meetings." />
    );
  }

  return (
    <div className="space-y-3">
      {summary.membersNeedingAttention.map((member) => (
        <div
          key={member._id}
          className="group rounded-xl border border-border/60 p-4 transition-colors hover:border-border"
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
          <Progress className="mt-3.5 gap-1.5" value={member.attendanceRate}>
            <ProgressTrack className="h-1.5 rounded-full">
              <ProgressIndicator
                className={
                  member.attendanceRate < 60
                    ? "rounded-full bg-destructive"
                    : "rounded-full bg-amber-500"
                }
              />
            </ProgressTrack>
          </Progress>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 p-8">
      <p className="max-w-xs text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
