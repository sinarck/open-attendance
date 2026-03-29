import { createLoader, createSerializer, parseAsString } from "nuqs/server";

export const onboardingSearchParams = {
  name: parseAsString.withDefault(""),
  slug: parseAsString.withDefault(""),
  timezone: parseAsString.withDefault(""),
};

export const loadOnboardingSearchParams = createLoader(onboardingSearchParams);

export const serializeOnboardingSearchParams = createSerializer(onboardingSearchParams);
