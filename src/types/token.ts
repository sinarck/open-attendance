export type TokenCountdown = {
  expiresAtMs: number | null;
  remainingMs: number | null;
  formatted: string | null;
  isExpired: boolean;
};
