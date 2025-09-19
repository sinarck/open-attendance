import { useCallback, useEffect, useMemo, useRef } from "react";
import { geoConfig } from "@/config/geo";
import { useGeolocationStore } from "@/stores/geolocation";
import type {
  GeolocationPermission,
  GeolocationReading,
  UseGeolocationOptions,
} from "@/types/geo";

const DEFAULTS: Required<UseGeolocationOptions> =
  geoConfig as Required<UseGeolocationOptions>;

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

  const clearTimersAndWatch = useCallback(() => {
    if (watchIdRef.current !== null && isSupported) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {}
      watchIdRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (improveRef.current) {
      clearTimeout(improveRef.current);
      improveRef.current = null;
    }
  }, [isSupported]);

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

  const onError = useCallback(
    (err: GeolocationPositionError) => {
      if (stoppedRef.current) return;
      if (err.code === err.PERMISSION_DENIED) setPermission("denied");
      const msg =
        err.message ||
        (err.code === err.PERMISSION_DENIED
          ? "Location permission denied"
          : err.code === err.POSITION_UNAVAILABLE
            ? "Location unavailable"
            : "Location request timed out");
      finalize("error", msg);
    },
    [finalize, setPermission],
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
    setError(null);
    setStatus("locating");

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

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        positionOptions,
      );
    } catch (e) {
      finalize(
        "error",
        e instanceof Error ? e.message : "Failed to start geolocation",
      );
      return;
    }

    // Hard stop for entire attempt
    timeoutRef.current = setTimeout(() => {
      if (stoppedRef.current) return;
      finalize("timeout", "Location request timed out");
    }, opts.timeoutMs);

    // Allow time for accuracy to improve, then finalize best effort
    improveRef.current = setTimeout(() => {
      if (stoppedRef.current) return;
      finalize("ready");
    }, opts.watchImprovementMs);
  }, [
    finalize,
    isSupported,
    onError,
    onSuccess,
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
  } as const;
}
