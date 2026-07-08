const localhostUrl = "http://localhost:3000";

const toHttpsOrigin = (host: string) => `https://${host}`;

export function getCanonicalSiteUrl() {
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (productionHost) {
    return toHttpsOrigin(productionHost);
  }

  return localhostUrl;
}

export function getCurrentSiteUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return getCanonicalSiteUrl();
  }

  const branchHost = process.env.VERCEL_BRANCH_URL;

  if (branchHost) {
    return toHttpsOrigin(branchHost);
  }

  const deploymentHost = process.env.VERCEL_URL;

  if (deploymentHost) {
    return toHttpsOrigin(deploymentHost);
  }

  return localhostUrl;
}

export const siteConfig = {
  name: "Open Attendance",
  description: "A simple, open-source attendance tracking system. Built for everyone.",
  url: getCanonicalSiteUrl(),
  repo: "https://github.com/sinarck/open-attendance",
  author: {
    name: "Aadi Sanghvi",
    url: "https://aadisanghvi.com",
  },
} as const;
