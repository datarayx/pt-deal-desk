import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";
import * as React from "react";

// DESIGN.md §3: soft background + coloured text. For statuses use <StatusBadge>, which adds the dot.
const badgeVariants = cva(
  [
    "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border border-transparent px-1.5",
    "text-caption font-medium whitespace-nowrap",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ],
  {
    variants: {
      variant: {
        default: "bg-neutral-soft text-neutral-soft-foreground",
        brand: "bg-brand text-brand-foreground",
        accent: "bg-accent-soft text-accent-ink",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        danger: "bg-danger-soft text-danger-soft-foreground",
        info: "bg-info-soft text-info-soft-foreground",
        outline: "border-border bg-surface text-muted-foreground",
        // shadcn aliases, kept so generated components keep working
        secondary: "bg-neutral-soft text-neutral-soft-foreground",
        destructive: "bg-danger-soft text-danger-soft-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
