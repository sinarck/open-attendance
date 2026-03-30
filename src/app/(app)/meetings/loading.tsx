import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MeetingsLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-14" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["s-1", "s-2", "s-3"].map((key) => (
                <TableRow key={key}>
                  <TableCell className="px-4 py-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-5 w-16 rounded-sm" />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-14 rounded-full" />
                      <Skeleton className="size-3 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-14" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["c-1", "c-2", "c-3", "c-4"].map((key) => (
                <TableRow key={key}>
                  <TableCell className="px-4 py-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-5 w-16 rounded-sm" />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
