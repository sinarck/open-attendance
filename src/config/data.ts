// Mock data for development/demo purposes
// TODO: Replace with real data from database

export const mockStats = {
  totalMembers: 24,
  sessionsThisMonth: 8,
  avgAttendance: 87,
  memberChange: 2,
  sessionChange: 8,
  attendanceChange: 3,
} as const;

export const mockSessions = [
  {
    id: 1,
    name: "Weekly Standup",
    date: "Dec 20, 2025",
    present: 12,
    total: 15,
    status: "completed",
  },
  {
    id: 2,
    name: "Planning Meeting",
    date: "Dec 18, 2025",
    present: 8,
    total: 10,
    status: "completed",
  },
  {
    id: 3,
    name: "Workshop",
    date: "Dec 23, 2025",
    present: 0,
    total: 15,
    status: "upcoming",
  },
  {
    id: 4,
    name: "Team Sync",
    date: "Dec 15, 2025",
    present: 14,
    total: 15,
    status: "completed",
  },
  {
    id: 5,
    name: "Retrospective",
    date: "Dec 13, 2025",
    present: 11,
    total: 12,
    status: "completed",
  },
  {
    id: 6,
    name: "Kickoff Meeting",
    date: "Dec 10, 2025",
    present: 20,
    total: 24,
    status: "completed",
  },
] as const;

export const mockMembers = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@school.edu",
    rate: 95,
    lastSeen: "Dec 20",
  },
  {
    id: 2,
    name: "Sam Chen",
    email: "sam@school.edu",
    rate: 88,
    lastSeen: "Dec 18",
  },
  {
    id: 3,
    name: "Jordan Taylor",
    email: "jordan@school.edu",
    rate: 100,
    lastSeen: "Dec 20",
  },
  {
    id: 4,
    name: "Morgan Lee",
    email: "morgan@school.edu",
    rate: 75,
    lastSeen: "Dec 15",
  },
  {
    id: 5,
    name: "Casey Rivera",
    email: "casey@school.edu",
    rate: 92,
    lastSeen: "Dec 20",
  },
  {
    id: 6,
    name: "Drew Martinez",
    email: "drew@school.edu",
    rate: 83,
    lastSeen: "Dec 18",
  },
  {
    id: 7,
    name: "Riley Kim",
    email: "riley@school.edu",
    rate: 67,
    lastSeen: "Dec 10",
  },
  {
    id: 8,
    name: "Avery Williams",
    email: "avery@school.edu",
    rate: 100,
    lastSeen: "Dec 20",
  },
] as const;

export const mockMonthlyTrends = [
  { month: "October", sessions: 6, avgAttendance: 82 },
  { month: "November", sessions: 10, avgAttendance: 85 },
  { month: "December", sessions: 8, avgAttendance: 87 },
] as const;

export type Session = (typeof mockSessions)[number];
export type Member = (typeof mockMembers)[number];
export type MonthlyTrend = (typeof mockMonthlyTrends)[number];
