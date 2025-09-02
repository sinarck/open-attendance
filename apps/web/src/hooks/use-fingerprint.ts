"use client";

import { useEffect, useState } from "react";

export function useFingerprint(enabled: boolean) {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      try {
        const { Thumbmark } = await import("@thumbmarkjs/thumbmarkjs");
        const tm = await new Thumbmark().get();
        const id = tm?.visitorId || tm?.thumbmark || "";
        if (active) setFingerprint(id || "fallback-" + Date.now());
      } catch {
        if (active) setFingerprint("fallback-" + Date.now());
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled]);

  return { fingerprint } as const;
}

