// Consolidated input/output types for tRPC routers.
// Keep these minimal and stable; import everywhere to reduce inline type noise.

// Meeting router
export type GenerateTokenOutput = {
  token: string;
};

export type CurrentMeetingOutput = {
  id: number;
  name: string;
  description: string | null;
  slug: string | null;
  startAt: Date;
  endAt: Date;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  strict: boolean;
  active: boolean;
};

// Check-in router
export type VerifyAndRecordInput = {
  token: string;
  userId: string;
  deviceFingerprint: string;
  geo: { lat: number; lng: number; accuracyM: number };
};

export type VerifyAndRecordOutput = {
  status: "ok";
  attendee: { userId: string; name: string | null };
};

export type VerifyAndRecordChromebookInput = {
  token: string;
  userId: string;
  deviceFingerprint: string;
};

export type VerifyAndRecordChromebookOutput = VerifyAndRecordOutput;

// Link router (example)
export type LinkCreateInput = {
  url: string;
};

export type LinkCreateOutput = unknown;
