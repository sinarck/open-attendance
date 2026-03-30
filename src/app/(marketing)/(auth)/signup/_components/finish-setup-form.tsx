"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SlugStatusIndicator } from "@/components/auth/slug-status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Form, type FormErrors } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { normalizeTimeZone } from "@/lib/date";
import { slugify } from "@/lib/slug";
import { toast } from "@/lib/toast";
import { api } from "../../../../../../convex/_generated/api";

interface FinishSetupFormProps {
  initialOrganizationName?: string;
  initialOrganizationSlug?: string;
  initialTimezone?: string;
}

export function FinishSetupForm({
  initialOrganizationName = "",
  initialOrganizationSlug = "",
  initialTimezone,
}: FinishSetupFormProps) {
  const router = useRouter();
  const createOrganization = useMutation(api.organizations.create);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [organizationSlug, setOrganizationSlug] = useState(
    initialOrganizationSlug || slugify(initialOrganizationName),
  );
  const autoSlugRef = useRef(slugify(initialOrganizationName));
  const slugStatus = useSlugAvailability(organizationSlug);
  const timezone = normalizeTimeZone(initialTimezone);

  async function handleSubmit(formValues: Record<string, any>) {
    setErrors({});

    if (slugStatus !== "available") {
      setErrors({ organizationSlug: "Pick an available organization URL first." });
      return;
    }

    const organizationName = String(formValues.organizationName ?? "").trim();

    if (organizationName.length < 2) {
      setErrors({ organizationName: "Enter your organization name to continue." });
      return;
    }

    setLoading(true);

    const result = await createOrganization({
      name: organizationName,
      slug: organizationSlug,
      timezone,
    });

    if (result.ok) {
      toast.success("Workspace ready", "Your organization is set up.");
      router.replace("/dashboard");
      return;
    }

    setLoading(false);

    switch (result.code) {
      case "auth":
        router.replace("/signup");
        return;
      case "exists":
        toast.success("Workspace ready", "Your organization is set up.");
        router.replace("/dashboard");
        return;
      case "slug":
        setErrors({ organizationSlug: result.message });
        return;
      default:
        throw new Error("Unknown organization result");
    }
  }

  return (
    <Card className="motion-safe:animate-auth-card-enter motion-reduce:animate-none">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Finish setting up your workspace</CardTitle>
        <CardDescription>We only need your organization name and URL.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onFormSubmit={handleSubmit} errors={errors}>
          <Field name="organizationName">
            <FieldLabel>Organization name</FieldLabel>
            <Input
              defaultValue={initialOrganizationName}
              onChange={(event) => {
                const nextAutoSlug = slugify(event.target.value);

                if (organizationSlug === "" || organizationSlug === autoSlugRef.current) {
                  setOrganizationSlug(nextAutoSlug);
                }

                autoSlugRef.current = nextAutoSlug;
              }}
              placeholder="Robotics Society"
              autoComplete="organization"
              required
              minLength={2}
              disabled={loading}
            />
            <FieldError />
          </Field>

          <Field name="organizationSlug">
            <FieldLabel>Organization URL</FieldLabel>
            <div className="group relative flex w-full rounded-lg border border-input bg-background shadow-xs transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/24">
              <span className="flex items-center rounded-l-lg border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                openattendance.app/
              </span>
              <FieldControl
                value={organizationSlug}
                onValueChange={(value) => {
                  setOrganizationSlug(slugify(value));
                }}
                render={(props) => (
                  <input
                    className="h-9 w-full min-w-0 bg-transparent pl-3 pr-12 font-mono text-sm outline-none placeholder:text-muted-foreground/72 sm:h-8"
                    placeholder="robotics-society"
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    disabled={loading}
                    {...mergeProps(props, { name: "organizationSlug" })}
                  />
                )}
              />
              <SlugStatusIndicator status={slugStatus} />
            </div>
            <FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription>
            <FieldError />
          </Field>

          <input type="hidden" name="timezone" value={timezone} />

          <Button type="submit" className="w-full" loading={loading}>
            Finish setup
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
