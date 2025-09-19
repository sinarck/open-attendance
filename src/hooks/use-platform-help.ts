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

  const instructions = useMemo(() => {
    if (info.isAndroid) {
      return "Android: Settings → Location → On. Then refresh this page.";
    }
    if (info.isIOS) {
      return "iOS: Settings → Privacy & Security → Location Services → On for Safari. Then refresh.";
    }
    return "Desktop: Allow location in the browser site permissions, then refresh.";
  }, [info.isAndroid, info.isIOS]);

  return { ...info, openLocationSettings, instructions } as const;
}
