const localhostUrl = "http://localhost:3000";

const toHttpsOrigin = (host: string) => `https://${host}`;

/**
 * Returns the canonical production app origin.
 */
export function getCanonicalAppUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? toHttpsOrigin(host) : localhostUrl;
}

/**
 * Returns the app origin that should be shown in the current deployment.
 *
 * @remarks
 * Preview builds prefer the stable branch alias when Vercel provides one so the
 * UI copy stays stable across redeploys of the same branch.
 */
export function getCurrentAppUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return getCanonicalAppUrl();
  }

  const host = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  return host ? toHttpsOrigin(host) : localhostUrl;
}
