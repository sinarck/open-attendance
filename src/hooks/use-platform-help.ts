import { useCallback, useMemo } from "react";

export function usePlatformHelp() {
  const info = useMemo(() => {
    if (typeof window === "undefined")
      return { isAndroid: false, isIOS: false };
    const ua = navigator.userAgent || "";
    return {
      isAndroid: /Android/i.test(ua),
      isIOS: /iPhone|iPad|iPod/i.test(ua),
    };
  }, []);

  const openLocationSettings = useCallback(() => {
    if (typeof window === "undefined") return;
    if (info.isAndroid) {
      try {
        window.location.href =
          "intent://settings#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end";
      } catch {}
      return;
    }
    // iOS and others: no-op; show instructions instead
  }, [info.isAndroid]);

  const steps = useMemo(() => {
    if (info.isAndroid) {
      return [
        "Open Settings → Location → turn Location On",
        "Settings → Apps → your browser → Permissions → Location → Allow",
        "Return to this page and refresh",
      ];
    }
    if (info.isIOS) {
      return [
        "Settings → Privacy & Security → Location Services → On",
        "Settings → Safari → Location → Allow",
        "Return to Safari and refresh this page",
      ];
    }
    return [
      "Click the lock icon in the address bar",
      "Site settings → Location → Allow",
      "Reload this page",
    ];
  }, [info.isAndroid, info.isIOS]);

  const ctaLabel = info.isAndroid ? "Open Location Settings" : undefined;

  return { ...info, openLocationSettings, steps, ctaLabel } as const;
}
