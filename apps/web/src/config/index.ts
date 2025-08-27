export const CONFIG = {
  qr: {
    // How often the kiosk refreshes the QR token (ms)
    refreshIntervalMs: 5_000,
  },
  geo: {
    // Geolocation API options
    enableHighAccuracy: true,
    timeoutMs: 6_000,
    maximumAgeMs: 0,
  },
};
