import { UserPlus } from "lucide-react";
import { MemberRow } from "@/components/attendance";
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
import { mockMembers } from "@/config";

export default function MembersPage() {
  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Members</h1>
            <p className="text-muted-foreground">
              Manage your roster and track attendance.
            </p>
          </div>
        </div>
        <TrackedLinkButton
          href="/dashboard"
          eventName="add_member_clicked"
          eventProperties={{ source: "members_page" }}
        >
          <UserPlus size={16} />
          Add Member
        </TrackedLinkButton>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMembers.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
