import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { osName } from "react-device-detect";
import { geoConfig } from "@/config/geo";
import { useGeolocationStore } from "@/stores/geolocation";
import type {
  GeolocationPermission,
  GeolocationReading,
  UseGeolocationOptions,
} from "@/types/geo";

const DEFAULTS: Required<UseGeolocationOptions> =
  geoConfig as Required<UseGeolocationOptions>;

const MAX_TRANSIENT_RESTARTS = 3;

const createAttemptId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // ignore and fall back below
    }
  }
  return `geo-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const isTransientLocationError = (err: GeolocationPositionError) => {
  const message = err.message?.toLowerCase() ?? "";
  return (
    err.code === err.POSITION_UNAVAILABLE ||
    message.includes("kclerrorlocationunknown") ||
    message.includes("kclerrordomain") ||
    message.includes("error domain error 0")
  );
};

export function useGeolocation(
  enabled: boolean,
  options?: UseGeolocationOptions,
) {
  const opts = useMemo(() => ({ ...DEFAULTS, ...(options ?? {}) }), [options]);

  const isSupported =
    typeof window !== "undefined" && "geolocation" in navigator;
  const {
    permission,
    status,
    reading,
    error,
    setPermission,
    setStatus,
    setReading,
    setError,
    setSupported,
    reset: resetStore,
  } = useGeolocationStore();

  // Keep support flag in sync (when SSR → CSR hydrating)
  useEffect(() => {
    setSupported(isSupported);
  }, [isSupported, setSupported]);

  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const improveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const bestRef = useRef<GeolocationReading | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const optionsRef = useRef<PositionOptions>({
    enableHighAccuracy: DEFAULTS.enableHighAccuracy,
    timeout: DEFAULTS.timeoutMs,
    maximumAge: DEFAULTS.maximumAgeMs,
  });

  const [attemptId, setAttemptId] = useState<string | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && isSupported) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {}
      watchIdRef.current = null;
    }
  }, [isSupported]);

  const clearTimersAndWatch = useCallback(() => {
    clearWatch();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (improveRef.current) {
      clearTimeout(improveRef.current);
      improveRef.current = null;
    }
  }, [clearWatch]);

  const finalize = useCallback(
    (finalStatus: "ready" | "timeout" | "error", finalError?: string) => {
      stoppedRef.current = true;
      clearTimersAndWatch();
      if (finalError) setError(finalError);
      if (bestRef.current) setReading(bestRef.current);
      setStatus(finalStatus);
    },
    [clearTimersAndWatch, setError, setReading, setStatus],
  );

  const onSuccess = useCallback(
    (pos: GeolocationPosition) => {
      if (stoppedRef.current) return;
      const next: GeolocationReading = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy ?? Number.POSITIVE_INFINITY,
        timestamp: pos.timestamp,
      };

      const prev = bestRef.current;
      const isBetter = !prev || next.accuracyM < prev.accuracyM;
      if (isBetter) {
        bestRef.current = next;
        setReading(next);
      }

      if (next.accuracyM <= opts.targetAccuracyM) {
        finalize("ready");
      }
    },
    [finalize, opts.targetAccuracyM, setReading],
  );

  const beginWatch = useCallback(
    (errorHandler: PositionErrorCallback) => {
      if (!isSupported) return false;
      clearWatch();
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          onSuccess,
          errorHandler,
          optionsRef.current,
        );
        return true;
      } catch {
        return false;
      }
    },
    [clearWatch, isSupported, onSuccess],
  );

  const onError = useCallback(
    (err: GeolocationPositionError) => {
      if (stoppedRef.current) return;
      if (err.code === err.PERMISSION_DENIED) setPermission("denied");
      const isChromeOS = osName === "Chrome OS";
      const msg = (() => {
        if (isChromeOS && err.code === err.PERMISSION_DENIED)
          return "Chromebook: location is blocked by policy";
        if (isChromeOS && err.code === err.POSITION_UNAVAILABLE)
          return "Chromebook: location unavailable (possibly blocked)";
        if (isChromeOS && err.code === err.TIMEOUT)
          return "Chromebook: location request timed out";
        return (
          err.message ||
          (err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : err.code === err.POSITION_UNAVAILABLE
              ? "Location unavailable"
              : "Location request timed out")
        );
      })();

      if (
        isTransientLocationError(err) &&
        retryCountRef.current < MAX_TRANSIENT_RESTARTS
      ) {
        retryCountRef.current += 1;
        const restarted = beginWatch(onError);
        if (!restarted) {
          finalize("error", msg);
        }
        return;
      }

      finalize("error", msg);
    },
    [beginWatch, finalize, setPermission],
  );

  const request = useCallback(() => {
    if (!isSupported) {
      setStatus("error");
      setError("Geolocation not supported");
      return;
    }

    // reset state
    stoppedRef.current = false;
    bestRef.current = null;
    retryCountRef.current = 0;
    setError(null);
    setStatus("locating");
    const newAttemptId = createAttemptId();
    attemptIdRef.current = newAttemptId;
    setAttemptId(newAttemptId);

    // Observe permission if supported (non-blocking)
    const navPerm = (
      navigator as Navigator & {
        permissions?: {
          query: (input: { name: PermissionName }) => Promise<PermissionStatus>;
        };
      }
    ).permissions;
    if (navPerm && typeof navPerm.query === "function") {
      navPerm
        .query({ name: "geolocation" })
        .then((p) => setPermission(p.state as GeolocationPermission))
        .catch(() => setPermission("unknown"));
    }

    // Start watching position for improving accuracy
    const positionOptions: PositionOptions = {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeoutMs,
      maximumAge: opts.maximumAgeMs,
    };
    optionsRef.current = positionOptions;

    const started = beginWatch(onError);
    if (!started) {
      const errMsg = "Failed to start geolocation";
      finalize("error", errMsg);
      return;
    }

    // Hard stop for entire attempt
    timeoutRef.current = setTimeout(() => {
      if (stoppedRef.current) return;
      const isChromeOS = osName === "Chrome OS";
      finalize(
        "timeout",
        isChromeOS
          ? "Chromebook: location request timed out"
          : "Location request timed out",
      );
    }, opts.timeoutMs);

    // Allow time for accuracy to improve, then finalize best effort
    improveRef.current = setTimeout(() => {
      if (stoppedRef.current) return;
      if (!bestRef.current) return;
      finalize("ready");
    }, opts.watchImprovementMs);
  }, [
    beginWatch,
    finalize,
    isSupported,
    onError,
    opts,
    setPermission,
    setStatus,
    setError,
  ]);

  const cancel = useCallback(() => {
    stoppedRef.current = true;
    clearTimersAndWatch();
    setStatus("idle");
  }, [clearTimersAndWatch, setStatus]);

  const reset = useCallback(() => {
    cancel();
    resetStore();
  }, [cancel, resetStore]);

  useEffect(() => {
    if (enabled) request();
    return () => {
      cancel();
    };
  }, [enabled, request, cancel]);

  return {
    isSupported,
    permission,
    status,
    reading,
    error,
    request,
    refresh: request,
    cancel,
    reset,
    attemptId,
  } as const;
}
