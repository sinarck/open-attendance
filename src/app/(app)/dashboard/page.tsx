import {
  Add01Icon,
  Calendar03Icon,
  ChartAverageIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { SessionRow } from "@/components/attendance";
import SignOutButton from "@/components/auth/signout-button";
import { StatCard } from "@/components/stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockSessions, mockStats } from "@/config";

// Derived from mock data
const stats = [
  {
    title: "Total Members",
    value: mockStats.totalMembers.toString(),
    icon: UserGroupIcon,
  },
  {
    title: "Sessions This Month",
    value: mockStats.sessionsThisMonth.toString(),
    icon: Calendar03Icon,
  },
  {
    title: "Avg Attendance",
    value: `${mockStats.avgAttendance}%`,
    icon: ChartAverageIcon,
  },
];

const recentSessions = mockSessions.slice(0, 4);

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-page py-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <Button render={<Link href="/sessions" />}>
          <HugeiconsIcon icon={Add01Icon} size={16} />
          New Session
        </Button>
        <SignOutButton />
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
