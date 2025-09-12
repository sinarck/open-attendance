"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/trpc/client";

export default function Home() {
  const { data } = trpc.dbCheck.useQuery();

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
          <pre className="rounded-md bg-muted p-4 text-xs leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
