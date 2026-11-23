import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";

// DESIGN.md: navy is the workhorse; 8px radius; one primary per view; pending state within 100ms.
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent",
    "text-small font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow] duration-100",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // Primary — navy (cyan in dark)
        default: "bg-brand text-brand-foreground shadow-xs hover:bg-brand-hover",
        // Secondary — white with border; the default for everything that isn't the main action
        outline:
          "border-border bg-surface text-foreground shadow-xs hover:border-border-strong hover:bg-surface-subtle aria-expanded:bg-surface-subtle",
        secondary: "bg-surface-subtle text-foreground hover:bg-border",
        ghost: "text-foreground hover:bg-surface-subtle aria-expanded:bg-surface-subtle",
        // Solid danger for confirming destructive actions
        destructive: "bg-danger text-danger-foreground shadow-xs hover:bg-danger/90",
        link: "h-auto border-0 px-0 text-accent-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-caption [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-md px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-4 text-body",
        icon: "size-8",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner, disables the button and sets aria-busy. */
    pending?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={pending || undefined}
      disabled={asChild ? undefined : disabled || pending}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {pending && <Loader2Icon className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants, type ButtonProps };
