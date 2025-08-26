export const CONFIG = {
  tokens: {
    // JWT TTL in seconds for QR tokens
    qrTokenTtlSeconds: 60,
    // Acceptable issued-at skew in seconds
    iatSkewSeconds: 120,
  },
  geofence: {
    // Max allowed client-reported accuracy (meters)
    maxAccuracyMeters: 50,
    // Extra buffer added to radius to account for GPS jitter (meters)
    radiusBufferMeters: 10,
  },
  rateLimit: {
    // Max requests per IP per minute
    perIpPerMinute: 20,
  },
};

