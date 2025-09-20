import { useCallback, useMemo } from "react";
import { isAndroid, isIOS } from "react-device-detect";

export function usePlatformHelp() {
  const openLocationSettings = useCallback(() => {
    if (typeof window === "undefined") return;
    if (isAndroid) {
      try {
        window.location.href =
          "intent://settings#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end";
      } catch {}
      return;
    }
    // iOS and others: no-op; show instructions instead
  }, []);

  const steps = useMemo(() => {
    if (isAndroid) {
      return [
        "Open Settings → Location → turn Location On",
        "Settings → Apps → your browser → Permissions → Location → Allow",
        "Return to this page and refresh",
      ];
    }
    if (isIOS) {
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
  }, []);

  const ctaLabel = isAndroid ? "Open Location Settings" : undefined;

  return { isAndroid, isIOS, openLocationSettings, steps, ctaLabel } as const;
}
