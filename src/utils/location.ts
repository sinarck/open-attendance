import { meetingConfig } from "@/config/meeting";

export const haversineMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const buildMeetingGeoPolicy = (meeting: {
  radiusM: number;
  maxAccuracyM?: number | null;
  radiusBufferM?: number | null;
}) => {
  const maxAccuracyM = meeting.maxAccuracyM ?? meetingConfig.maxAccuracyMeters;
  const radiusBufferM =
    meeting.radiusBufferM ?? meetingConfig.radiusBufferMeters;
  return {
    maxAccuracyM,
    radiusBufferM,
    effectiveRadiusM: meeting.radiusM + radiusBufferM,
  };
};

export const isAccuracyAcceptable = (accuracyM: number, maxAccuracyM: number) =>
  accuracyM <= maxAccuracyM;

export const isWithinAdjustedRadius = ({
  distanceM,
  accuracyM,
  radiusM,
  radiusBufferM,
}: {
  distanceM: number;
  accuracyM: number;
  radiusM: number;
  radiusBufferM: number;
}) => {
  const effectiveRadius = radiusM + radiusBufferM;
  const adjustedDistance = Math.max(distanceM - accuracyM, 0);
  return adjustedDistance <= effectiveRadius;
};
