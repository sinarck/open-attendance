import type { Doc } from "../../convex/_generated/dataModel";

export interface ReportsOverview {
  summary: {
    totalMembers: number;
    activeMembers: number;
    archivedMembers: number;
    totalMeetings: number;
    activeMeetings: number;
  };
  meetings: Doc<"meetings">[];
  members: Doc<"members">[];
}
