export interface OnboardingSearchParams {
  name: string;
  slug: string;
  timezone: string;
}

export type OrganizationSlugStatus = "idle" | "checking" | "available" | "unavailable";
