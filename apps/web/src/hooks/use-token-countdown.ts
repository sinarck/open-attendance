"use client";

import { useEffect, useMemo, useState } from "react";

export type TokenCountdown = {
  expiresAtMs: number | null;
  remainingMs: number | null;
  formatted: string | null;
  isExpired: boolean;
};

const base64UrlToJson = (b64url: string) => {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const json = atob(padded);
  return JSON.parse(json);
};

const format = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export function useTokenCountdown(
  token: string | null | undefined
): TokenCountdown {
  const expiresAtMs = useMemo(() => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = base64UrlToJson(parts[1]);
      return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }, [token]);

  const [remainingMs, setRemainingMs] = useState<number | null>(
    expiresAtMs ? Math.max(expiresAtMs - Date.now(), 0) : null
  );

  useEffect(() => {
    if (!expiresAtMs) {
      setRemainingMs(null);
      return;
    }
    const update = () => setRemainingMs(Math.max(expiresAtMs - Date.now(), 0));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAtMs]);

  return {
    expiresAtMs,
    remainingMs,
    formatted: typeof remainingMs === "number" ? format(remainingMs) : null,
    isExpired: remainingMs === 0,
  };
}

