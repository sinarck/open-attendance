import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Robust Chromebook detection using UA heuristics. Prefer server-side enforcement,
// but this helps show the correct UI. We check for CrOS token and exclude Android/iOS.
export function isChromeOSUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  const s = ua.toLowerCase();
  if (s.includes("android") || s.includes("iphone") || s.includes("ipad"))
    return false;
  return /cros/.test(s);
}
