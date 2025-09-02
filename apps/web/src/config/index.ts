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
  thumbmark: {
    // Public client key for ThumbmarkJS
    apiKey: process.env.NEXT_PUBLIC_THUMBMARK_API_KEY,
  },
};

