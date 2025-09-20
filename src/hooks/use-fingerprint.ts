import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import store from "store2";

const STORAGE_KEY = "device_fingerprint";
const COOKIE_NAME = "dfp";

export function useFingerprint(enabled: boolean) {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      // Read from localStorage via store2 and cookie via js-cookie
      const ls = store.get(STORAGE_KEY) as string | null;
      const ck = Cookies.get(COOKIE_NAME) ?? null;

      if (ls) {
        // Mirror to cookie if missing
        if (!ck)
          Cookies.set(COOKIE_NAME, ls, {
            sameSite: "lax",
            secure: location.protocol === "https:",
            expires: 365 * 5,
          });
        setFingerprint(ls);
        return;
      }

      if (ck) {
        // Recover into LS if only cookie exists
        try {
          store.set(STORAGE_KEY, ck);
        } catch {}
        setFingerprint(ck);
        return;
      }

      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        store.set(STORAGE_KEY, id);
      } catch {}
      Cookies.set(COOKIE_NAME, id, {
        sameSite: "lax",
        secure: location.protocol === "https:",
        expires: 365 * 5,
      });
      setFingerprint(id);
    } catch {
      setFingerprint(null);
    }
  }, [enabled]);

  return { fingerprint } as const;
}
