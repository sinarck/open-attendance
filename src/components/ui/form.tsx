"use client";

import { Form as FormPrimitive } from "@base-ui/react/form";
import type * as React from "react";
import { cn } from "@/lib/utils";

type FormProps = React.ComponentProps<typeof FormPrimitive>;
type FormErrors = NonNullable<FormProps["errors"]>;

function Form({ className, ...props }: FormProps) {
  return (
    <FormPrimitive
      className={cn("flex w-full flex-col gap-4", className)}
      data-slot="form"
      {...props}
    />
  );
}

export { Form, type FormErrors, type FormProps };
