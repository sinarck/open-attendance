import { siteConfig } from "./site";

export const externalLinks = {
  github: siteConfig.repo,
} as const;

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
