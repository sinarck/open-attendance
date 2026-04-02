import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReportsLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {["stat-1", "stat-2", "stat-3"].map((key) => (
          <Card key={key}>
            <CardContent className="pt-5 pb-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2 h-7 w-12" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-3.5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-16" />
                  </TableHead>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-16" />
                  </TableHead>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-16" />
                  </TableHead>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-12" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {["trend-1", "trend-2", "trend-3"].map((key) => (
                  <TableRow key={key}>
                    <TableCell className="px-4 py-2">
                      <Skeleton className="h-3.5 w-28" />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Skeleton className="h-3.5 w-20" />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-10 rounded-sm" />
                        <Skeleton className="h-4 w-8 rounded-sm" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-3.5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-16" />
                  </TableHead>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-20" />
                  </TableHead>
                  <TableHead className="px-4">
                    <Skeleton className="h-3.5 w-12" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {["member-1", "member-2", "member-3"].map((key) => (
                  <TableRow key={key}>
                    <TableCell className="px-4 py-2">
                      <Skeleton className="h-3.5 w-28" />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Skeleton className="h-4.5 w-20 rounded-sm" />
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
