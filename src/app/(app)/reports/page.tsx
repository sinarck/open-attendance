import {
  Calendar03Icon,
  ChartAverageIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { MonthlyTrendRow, SessionHistoryRow } from "@/components/attendance";
import { TrendStatCard } from "@/components/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockMonthlyTrends, mockSessions, mockStats } from "@/config";

const stats = [
  {
    title: "Total Members",
    value: mockStats.totalMembers.toString(),
    change: `+${mockStats.memberChange}`,
    trend: "up" as const,
    icon: UserGroupIcon,
  },
  {
    title: "Total Sessions",
    value: (mockStats.sessionsThisMonth * 4).toString(),
    change: `+${mockStats.sessionChange}`,
    trend: "up" as const,
    icon: Calendar03Icon,
  },
  {
    title: "Avg Attendance",
    value: `${mockStats.avgAttendance}%`,
    change: `+${mockStats.attendanceChange}%`,
    trend: "up" as const,
    icon: ChartAverageIcon,
  },
];

const completedSessions = mockSessions
  .filter((s) => s.status === "completed")
  .slice(0, 5);

export default function ReportsPage() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Attendance insights and analytics.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <TrendStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Attendance patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Avg Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMonthlyTrends.map((data) => (
                  <MonthlyTrendRow key={data.month} data={data} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Session attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSessions.map((session) => (
                  <SessionHistoryRow key={session.id} session={session} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
