import { BarChart3, Calendar, LayoutDashboard, Users } from "lucide-react";

export const APP_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/members", label: "Members", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function isAppNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
