import { useEffect, useState } from "react";

const STORAGE_KEY = "device_fingerprint";

export function useFingerprint(enabled: boolean) {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        setFingerprint(existing);
        return;
      }
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
      setFingerprint(id);
    } catch {
      setFingerprint(null);
    }
  }, [enabled]);

  return { fingerprint } as const;
}
