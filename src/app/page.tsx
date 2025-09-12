"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export default function Home() {
  const { data, isPending } = trpc.dbCheck.useQuery();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">
          Manage events and attendance. This is a placeholder home until the
          dashboard is built.
        </p>
      </section>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>System check</CardTitle>
          <CardDescription>Database connectivity via TRPC</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <pre className="rounded-md bg-muted p-4 text-xs leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
