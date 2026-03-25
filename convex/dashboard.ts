import type { Doc } from "./_generated/dataModel";
import { authedQuery } from "./lib/auth";

interface DashboardMeetingSummary {
  _id: Doc<"meetings">["_id"];
  name: string;
  location?: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  recorded: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  geoFenceEnabled: boolean;
  fingerprintEnabled: boolean;
  stage: "live" | "upcoming" | "closed";
}

interface DashboardRiskMember {
  _id: Doc<"members">["_id"];
  name: string;
  identifier: string;
  attendanceRate: number;
  attended: number;
  excused: number;
  missed: number;
  lastCheckInAt?: number;
}

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  archivedMembers: number;
  totalMeetings: number;
  activeMeetings: number;
  completedMeetings: number;
  totalCheckIns: number;
  recentAttendanceRate: number;
  geoFenceMeetings: number;
  fingerprintMeetings: number;
  liveMeeting: DashboardMeetingSummary | null;
  upcomingMeeting: Pick<
    DashboardMeetingSummary,
    "_id" | "name" | "location" | "startTime" | "endTime"
  > | null;
  recentMeetings: DashboardMeetingSummary[];
  membersNeedingAttention: DashboardRiskMember[];
}

function getMeetingStage(meeting: Doc<"meetings">, now: number) {
  if (meeting.isActive) {
    return "live" as const;
  }

  if (meeting.startTime > now) {
    return "upcoming" as const;
  }

  return "closed" as const;
}

function getAttendanceRate(recorded: number, totalMembers: number) {
  if (totalMembers === 0) {
    return 0;
  }

  return Math.round((recorded / totalMembers) * 100);
}

export const summary = authedQuery({
  args: {},
  handler: async (ctx): Promise<DashboardSummary> => {
    const now = Date.now();
    const [members, meetings, records] = await Promise.all([
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
        .collect(),
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
        .collect(),
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) => q.eq("organizationId", ctx.organizationId))
        .collect(),
    ]);

    const activeMembers = members.filter((member) => member.isActive);
    const sortedMeetings = [...meetings].sort((a, b) => b.startTime - a.startTime);
    const activeMeetingList = sortedMeetings.filter((meeting) => meeting.isActive);
    const completedMeetings = sortedMeetings.filter((meeting) => meeting.endTime <= now);
    const upcomingMeeting = [...sortedMeetings]
      .filter((meeting) => meeting.startTime > now)
      .sort((a, b) => a.startTime - b.startTime)[0];

    const recordsByMeeting = new Map<Doc<"meetings">["_id"], Doc<"attendanceRecords">[]>();
    const attendanceByMember = new Map<
      Doc<"members">["_id"],
      { attended: number; excused: number; lastCheckInAt?: number }
    >();

    for (const record of records) {
      const meetingRecords = recordsByMeeting.get(record.meetingId) ?? [];
      meetingRecords.push(record);
      recordsByMeeting.set(record.meetingId, meetingRecords);

      const current = attendanceByMember.get(record.memberId) ?? {
        attended: 0,
        excused: 0,
        lastCheckInAt: undefined,
      };

      if (record.status === "present" || record.status === "late") {
        current.attended += 1;
      }

      if (record.status === "excused") {
        current.excused += 1;
      }

      current.lastCheckInAt = Math.max(current.lastCheckInAt ?? 0, record._creationTime);
      attendanceByMember.set(record.memberId, current);
    }

    const recentMeetings = sortedMeetings.slice(0, 5).map((meeting) => {
      const meetingRecords = recordsByMeeting.get(meeting._id) ?? [];
      const late = meetingRecords.filter((record) => record.status === "late").length;
      const excused = meetingRecords.filter((record) => record.status === "excused").length;
      const recorded = meetingRecords.length;

      return {
        _id: meeting._id,
        name: meeting.name,
        location: meeting.location,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        isActive: meeting.isActive,
        recorded,
        absent: Math.max(activeMembers.length - recorded, 0),
        late,
        excused,
        attendanceRate: getAttendanceRate(recorded, activeMembers.length),
        geoFenceEnabled: meeting.geoFenceRadiusM !== undefined,
        fingerprintEnabled: meeting.requireFingerprint,
        stage: getMeetingStage(meeting, now),
      } satisfies DashboardMeetingSummary;
    });

    const liveMeeting = recentMeetings.find((meeting) => meeting.isActive) ?? null;
    const recentRecordedCount = recentMeetings.reduce(
      (total, meeting) => total + meeting.recorded,
      0,
    );
    const recentAttendanceDenominator = activeMembers.length * recentMeetings.length;
    const membersNeedingAttention = activeMembers
      .map((member) => {
        const stats = attendanceByMember.get(member._id) ?? {
          attended: 0,
          excused: 0,
          lastCheckInAt: undefined,
        };

        return {
          _id: member._id,
          name: member.name,
          identifier: member.identifier,
          attendanceRate:
            completedMeetings.length === 0
              ? 0
              : Math.round((stats.attended / completedMeetings.length) * 100),
          attended: stats.attended,
          excused: stats.excused,
          missed: Math.max(completedMeetings.length - stats.attended - stats.excused, 0),
          lastCheckInAt: stats.lastCheckInAt,
        } satisfies DashboardRiskMember;
      })
      .sort((a, b) => {
        if (a.attendanceRate !== b.attendanceRate) {
          return a.attendanceRate - b.attendanceRate;
        }

        return (a.lastCheckInAt ?? 0) - (b.lastCheckInAt ?? 0);
      })
      .slice(0, 5);

    return {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      archivedMembers: members.length - activeMembers.length,
      totalMeetings: sortedMeetings.length,
      activeMeetings: activeMeetingList.length,
      completedMeetings: completedMeetings.length,
      totalCheckIns: records.length,
      recentAttendanceRate:
        recentAttendanceDenominator === 0
          ? 0
          : Math.round((recentRecordedCount / recentAttendanceDenominator) * 100),
      geoFenceMeetings: sortedMeetings.filter((meeting) => meeting.geoFenceRadiusM !== undefined)
        .length,
      fingerprintMeetings: sortedMeetings.filter((meeting) => meeting.requireFingerprint).length,
      liveMeeting,
      upcomingMeeting: upcomingMeeting
        ? {
            _id: upcomingMeeting._id,
            name: upcomingMeeting.name,
            location: upcomingMeeting.location,
            startTime: upcomingMeeting.startTime,
            endTime: upcomingMeeting.endTime,
          }
        : null,
      recentMeetings,
      membersNeedingAttention,
    };
  },
});
