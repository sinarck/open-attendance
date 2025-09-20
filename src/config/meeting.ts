const offsetSeconds = 15;

export const meetingConfig = {
  qrTokenTtlSeconds: 120 + offsetSeconds,
  iatSkewSeconds: 10,
  maxAccuracyMeters: 100,
  radiusBufferMeters: 10,
  refreshIntervalMs: offsetSeconds * 1000,
};
