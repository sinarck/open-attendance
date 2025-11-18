import { describe, expect, it } from "bun:test";
import {
  buildMeetingGeoPolicy,
  isAccuracyAcceptable,
  isWithinAdjustedRadius,
} from "@/utils/location";

describe("geo policy helpers", () => {
  it("builds policy with meeting overrides when present", () => {
    const policy = buildMeetingGeoPolicy({
      radiusM: 40,
      maxAccuracyM: 75,
      radiusBufferM: 15,
    });
    expect(policy.maxAccuracyM).toBe(75);
    expect(policy.radiusBufferM).toBe(15);
    expect(policy.effectiveRadiusM).toBe(55);
  });

  it("accepts accuracy that is within limit and rejects when above", () => {
    expect(isAccuracyAcceptable(50, 75)).toBe(true);
    expect(isAccuracyAcceptable(90, 75)).toBe(false);
  });

  it("allows distance when accuracy bubble overlaps fence", () => {
    const radiusM = 30;
    const radiusBufferM = 10;
    const accuracyM = 25;
    const distanceWithin = radiusM + radiusBufferM + 5; // 45
    const distanceOutside = radiusM + radiusBufferM + 40; // 80
    expect(
      isWithinAdjustedRadius({
        distanceM: distanceWithin,
        accuracyM,
        radiusM,
        radiusBufferM,
      }),
    ).toBe(true);
    expect(
      isWithinAdjustedRadius({
        distanceM: distanceOutside,
        accuracyM,
        radiusM,
        radiusBufferM,
      }),
    ).toBe(false);
  });
});
