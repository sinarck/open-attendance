import { getCanonicalAppUrl } from "@/lib/deployment";

export const siteConfig = {
  name: "Open Attendance",
  description: "A simple, open-source attendance tracking system. Built for everyone.",
  url: getCanonicalAppUrl(),
  repo: "https://github.com/sinarck/open-attendance",
  author: {
    name: "Aadi Sanghvi",
    url: "https://aadisanghvi.com",
  },
} as const;
