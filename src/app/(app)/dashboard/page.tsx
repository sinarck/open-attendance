import { Calendar, Plus, TrendingUp, Users } from "lucide-react";
import { SessionRow } from "@/components/attendance";
import { StatCard } from "@/components/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrackedLinkButton } from "@/components/ui/tracked-link-button";
import { mockSessions, mockStats } from "@/config";

// Derived from mock data
const stats = [
  {
    title: "Total Members",
    value: mockStats.totalMembers.toString(),
    icon: Users,
  },
  {
    title: "Sessions This Month",
    value: mockStats.sessionsThisMonth.toString(),
    icon: Calendar,
  },
  {
    title: "Avg Attendance",
    value: `${mockStats.avgAttendance}%`,
    icon: TrendingUp,
  },
];

const recentSessions = mockSessions.slice(0, 4);

export default function DashboardPage() {
  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back. Here&apos;s what&apos;s happening.
            </p>
          </div>
        </div>
        <TrackedLinkButton
          href="/sessions"
          eventName="new_session_clicked"
          eventProperties={{ source: "dashboard" }}
        >
          <Plus size={16} />
          New Session
        </TrackedLinkButton>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
