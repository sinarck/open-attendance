import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MembersLoading() {
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
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="px-4">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["m-1", "m-2", "m-3", "m-4"].map((key) => (
                <TableRow key={key}>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-5 w-20 rounded-sm" />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
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
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["a-1", "a-2"].map((key) => (
                <TableRow key={key} className="opacity-50">
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Skeleton className="h-5 w-20 rounded-sm" />
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
