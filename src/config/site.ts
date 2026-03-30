import { getCanonicalUrl } from "@/lib/env";

export const siteConfig = {
  name: "Open Attendance",
  description: "A simple, open-source attendance tracking system. Built for everyone.",
  url: getCanonicalUrl(),
  repo: "https://github.com/sinarck/open-attendance",
  author: {
    name: "Aadi Sanghvi",
    url: "https://aadisanghvi.com",
  },
} as const;
