import type { VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type * as React from "react";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

interface ButtonBaseProps {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  loading?: boolean;
  children?: React.ReactNode;
}

interface ButtonRenderProps {
  className?: string;
  children?: React.ReactNode;
  "data-slot"?: string;
  "aria-disabled"?: React.AriaAttributes["aria-disabled"];
}

type ButtonAsButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    render?: undefined;
  };

type ButtonAsChildProps = ButtonBaseProps &
  Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
    disabled?: boolean;
    render: React.ReactElement<ButtonRenderProps>;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsChildProps;

function Button(props: ButtonProps) {
  const { className, variant, size, loading, children } = props;
  const buttonClassName = cn(buttonVariants({ className, size, variant }));
  const content = (
    <>
      {loading && <LoaderCircle className="animate-spin" />}
      {children}
    </>
  );

  if ("render" in props && props.render && isValidElement(props.render)) {
    const {
      render,
      disabled,
      className: _className,
      variant: _variant,
      size: _size,
      loading: _loading,
      children: _children,
      ...elementProps
    } = props;

    return cloneElement(render, {
      className: buttonClassName,
      "data-slot": "button",
      "aria-disabled": disabled || loading || undefined,
      children: content,
      ...elementProps,
    });
  }

  const {
    disabled,
    type,
    className: _className,
    variant: _variant,
    size: _size,
    loading: _loading,
    children: _children,
    ...buttonProps
  } = props as ButtonAsButtonProps;

  return (
    <button
      className={buttonClassName}
      data-slot="button"
      disabled={disabled || loading}
      type={type ?? "button"}
      {...buttonProps}
    >
      {content}
    </button>
  );
}

export { Button };
