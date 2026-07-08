import { BarChart3, Calendar, LayoutDashboard, Users } from "lucide-react";
import { siteConfig } from "./site";

export const externalLinks = {
  github: siteConfig.repo,
} as const;

export const appNavigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/members", label: "Members", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export const footerSections = [
  {
    title: "Product",
    links: [{ href: externalLinks.github, label: "GitHub", external: true }],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

export function isAppNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
