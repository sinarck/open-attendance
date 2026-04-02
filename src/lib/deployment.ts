const localhostUrl = "http://localhost:3000";

const toHttpsOrigin = (host: string) => `https://${host}`;

function getDeploymentHosts() {
  return [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ].filter((host): host is string => Boolean(host));
}

/**
 * Returns the canonical production app origin.
 *
 * @remarks
 * This is metadata/display policy, not auth policy. Better Auth derives its
 * runtime origin from the current request in production.
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

/**
 * Exact origins trusted for browser-initiated auth requests.
 *
 * @remarks
 * Keep this list host-exact and shared between Next display helpers and Better
 * Auth so the UI copy and CSRF allowlist cannot drift.
 */
export function getTrustedAppOrigins() {
  return [localhostUrl, ...new Set(getDeploymentHosts().map(toHttpsOrigin))];
}
