import { Suspense } from "react";
import { requireAuthenticated } from "@/lib/auth/guards";
import { MeetingsSectionsLoading } from "./loading";
import { MeetingsContent } from "./meetings-client";

async function MeetingsPageContent() {
  await requireAuthenticated();

  return <MeetingsContent />;
}

/**
 * Protected meetings route entry.
 *
 * @remarks
 * Keep the route export synchronous so request-time auth stays under the
 * route-local `<Suspense>` boundary.
 */
export default function MeetingsPage() {
  return (
    <main className="space-y-6 p-4 sm:p-6">
      <Suspense fallback={<MeetingsSectionsLoading />}>
        <MeetingsPageContent />
      </Suspense>
    </main>
  );
}
