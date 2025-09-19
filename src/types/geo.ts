export type GeolocationReading = {
  lat: number;
  lng: number;
  accuracyM: number;
  timestamp: number;
};

export type GeolocationPermission = "unknown" | "prompt" | "granted" | "denied";

export type GeolocationStatus =
  | "idle"
  | "locating"
  | "ready"
  | "timeout"
  | "error";

export type UseGeolocationOptions = Partial<{
  enableHighAccuracy: boolean;
  timeoutMs: number;
  maximumAgeMs: number;
  watchImprovementMs: number;
  targetAccuracyM: number;
}>;
