import { useEffect, useMemo, useRef, useState } from "react";
import type { TokenCountdown } from "@/types/token";

const decodeJwtExpMs = (token: string | null | undefined): number | null => {
  if (!token) return null;
  try {
    const [, payloadB64url] = token.split(".");
    if (!payloadB64url) return null;
    const b64 = payloadB64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const formatMmSs = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export function useTokenCountdown(
  token: string | null | undefined,
): TokenCountdown {
  const expiresAtMs = useMemo(() => decodeJwtExpMs(token), [token]);
  const [remainingMs, setRemainingMs] = useState<number | null>(
    expiresAtMs ? Math.max(expiresAtMs - Date.now(), 0) : null,
  );
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset on token change
    if (!expiresAtMs) {
      setRemainingMs(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const update = () => setRemainingMs(Math.max(expiresAtMs - Date.now(), 0));
    update();
    intervalRef.current = window.setInterval(update, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [expiresAtMs]);

  return {
    expiresAtMs,
    remainingMs,
    formatted: typeof remainingMs === "number" ? formatMmSs(remainingMs) : null,
    isExpired: remainingMs === 0,
  } as const;
}
