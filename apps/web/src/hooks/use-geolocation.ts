"use client";

import { CONFIG } from "@/config";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type GeolocationReading = {
  lat: number;
  lng: number;
  accuracyM: number;
};

export function useGeolocation(
  enabled: boolean,
  options?: Partial<{
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
  }>
) {
  const [geo, setGeo] = useState<GeolocationReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const geoOptions = useMemo(() => {
    return {
      enableHighAccuracy:
        options?.enableHighAccuracy ?? CONFIG.geo.enableHighAccuracy,
      timeout: options?.timeout ?? CONFIG.geo.timeoutMs,
      maximumAge: options?.maximumAge ?? CONFIG.geo.maximumAgeMs,
    } satisfies PositionOptions;
  }, [options]);

  const request = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Geolocation not supported by this browser");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelledRef.current) return;
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? 9999,
        });
        setLoading(false);
      },
      (err) => {
        if (cancelledRef.current) return;
        setError(err.message || "Location access is blocked or unavailable.");
        setLoading(false);
      },
      geoOptions
    );
  }, [geoOptions]);

  useEffect(() => {
    cancelledRef.current = false;
    if (enabled) {
      request();
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [enabled, request]);

  return {
    geo,
    error,
    isLoading: loading,
    refresh: request,
  } as const;
}

