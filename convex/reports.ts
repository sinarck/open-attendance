import type { Doc } from "./_generated/dataModel";
import { authedQuery } from "./lib/auth";

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

export const overview = authedQuery({
  args: {},
  handler: async (ctx): Promise<ReportsOverview> => {
    const [meetings, members] = await Promise.all([
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
        .order("desc")
        .collect(),
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
        .collect(),
    ]);

    const activeMembers = members.filter((member) => member.isActive).length;
    const activeMeetings = meetings.filter((meeting) => meeting.isActive).length;

    return {
      summary: {
        totalMembers: members.length,
        activeMembers,
        archivedMembers: members.length - activeMembers,
        totalMeetings: meetings.length,
        activeMeetings,
      },
      meetings,
      members,
    };
  },
});
