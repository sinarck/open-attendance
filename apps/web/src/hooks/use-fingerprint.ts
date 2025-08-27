"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFingerprint(enabled: boolean) {
  const [fingerprint, setFingerprint] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const { default: FingerprintJS } = await import(
        "@fingerprintjs/fingerprintjs"
      );
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      if (!cancelledRef.current) {
        setFingerprint(result.visitorId);
      }
    } catch (err: any) {
      if (!cancelledRef.current) {
        setError(err?.message || "Failed to generate device fingerprint");
        setFingerprint("fallback-" + Date.now());
      }
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    cancelledRef.current = false;
    if (enabled) {
      void load();
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [enabled, load]);

  return { fingerprint, isLoading, error, refresh: load } as const;
}

