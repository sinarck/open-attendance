import type { Doc } from "../../convex/_generated/dataModel";

export interface DashboardMeetingSummary {
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
  geofenceEnabled: boolean;
  fingerprintEnabled: boolean;
  stage: "live" | "upcoming" | "closed";
}

export interface DashboardRiskMember {
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
  timezone: string;
  totalMembers: number;
  activeMembers: number;
  archivedMembers: number;
  totalMeetings: number;
  activeMeetings: number;
  completedMeetings: number;
  totalCheckIns: number;
  recentAttendanceRate: number;
  geofenceMeetings: number;
  fingerprintMeetings: number;
  liveMeeting: DashboardMeetingSummary | null;
  upcomingMeeting: Pick<
    DashboardMeetingSummary,
    "_id" | "name" | "location" | "startTime" | "endTime"
  > | null;
  recentMeetings: DashboardMeetingSummary[];
  membersNeedingAttention: DashboardRiskMember[];
}
