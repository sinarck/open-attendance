"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

type IntlWithSupportedValuesOf = typeof Intl & {
  supportedValuesOf(key: "timeZone"): string[];
};

const TIMEZONES = (Intl as IntlWithSupportedValuesOf).supportedValuesOf("timeZone");
const INPUT =
  "flex h-9 w-full rounded-md border bg-transparent px-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function OnboardingPage() {
  const router = useRouter();
  const complete = useMutation(api.organizations.completeOnboarding);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slug, setSlug] = useState("");

  const form = useForm({
    defaultValues: {
      name: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    onSubmit: async ({ value }) => {
      await complete({
        name: value.name.trim(),
        slug,
        timezone: value.timezone,
      });
      router.replace("/dashboard");
    },
  });

  const available = useQuery(
    api.organizations.isSlugAvailable,
    slug.length >= 2 ? { slug } : "skip",
  );
  const checking = slug.length >= 2 && available === undefined;

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <h1 className="text-xl font-semibold tracking-tight">Set up your organization</h1>
      <p className="mt-1 text-sm text-muted-foreground">You can change this later.</p>

      <form
        className="mt-8 space-y-5"
        action={() => {
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              value.trim().length < 2 ? "At least 2 characters" : undefined,
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="text-[13px] font-medium">
                Organization name
              </label>
              <input
                id={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  if (!slugEdited) setSlug(toSlug(e.target.value));
                }}
                placeholder="Robotics Society"
                className={INPUT}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive-foreground">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <div className="space-y-1.5">
          <label htmlFor="slug" className="text-[13px] font-medium">
            URL slug
          </label>
          <div className="flex">
            <span className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-[13px] text-muted-foreground">
              openattendance.app/
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(toSlug(e.target.value));
              }}
              placeholder="robotics-society"
              className={`${INPUT} rounded-l-none rounded-r-md font-mono`}
            />
          </div>
          {slug.length >= 2 && (
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {checking ? (
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
              ) : available ? (
                <>
                  <Check className="size-3 text-success-foreground" />
                  <span className="text-success-foreground">Available</span>
                </>
              ) : (
                <>
                  <X className="size-3 text-destructive-foreground" />
                  <span className="text-destructive-foreground">Taken</span>
                </>
              )}
            </div>
          )}
        </div>

        <form.Field name="timezone">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="text-[13px] font-medium">
                Timezone
              </label>
              <select
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={INPUT}
              >
                {TIMEZONES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(s) =>
            [s.canSubmit && available === true && !checking, s.isSubmitting] as const
          }
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
