import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout(_props: LayoutProps<"/">) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Secure redirect for unauthenticated users
  if (!session) {
    redirect("/login");
  }
}
