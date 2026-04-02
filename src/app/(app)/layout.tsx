import { type ReactNode } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppNavbar />
      {children}
    </div>
  );
}
