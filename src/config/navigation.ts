import { siteConfig } from "./site";

// Public navigation (marketing site)
export const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
] as const;

// Authenticated navigation (app)
export const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sessions", label: "Sessions" },
  { href: "/members", label: "Members" },
  { href: "/reports", label: "Reports" },
] as const;

// External links
export const externalLinks = {
  github: siteConfig.repo,
} as const;

// Footer link sections (used for efficient single-pass rendering)
export const footerSections = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: externalLinks.github, label: "GitHub", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;
