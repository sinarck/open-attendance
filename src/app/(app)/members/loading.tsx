import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MembersSectionsLoading() {
  return (
    <>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-6 rounded-sm" />
        </div>
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
              {["m-1", "m-2", "m-3", "m-4"].map((key) => (
                <TableRow key={key}>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-4.5 w-20 rounded-sm" />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-3.5 w-12" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-6 rounded-sm" />
        </div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {["a-1", "a-2"].map((key) => (
                <TableRow key={key} className="opacity-50">
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-3.5 w-28" />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-4.5 w-20 rounded-sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}

export default function MembersLoading() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <section className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </section>
      <MembersSectionsLoading />
    </main>
  );
}
