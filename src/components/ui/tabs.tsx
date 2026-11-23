"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

// Two styles:
//  - "line" (default): underline tabs for detail pages (Overview · Documents · Repayments · Activity)
//  - "segmented": compact switch for view toggles (Kanban / Table)
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/tabs flex gap-4 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center text-muted-foreground",
  {
    variants: {
      variant: {
        line: "h-10 gap-5 border-b border-border group-data-[orientation=horizontal]/tabs:w-full",
        segmented: "h-8 gap-0.5 rounded-lg border border-border bg-surface-subtle p-0.5",
      },
    },
    defaultVariants: {
      variant: "line",
    },
  },
);

function TabsList({
  className,
  variant = "line",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 text-small font-medium whitespace-nowrap transition-colors duration-100",
        "hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // line
        "group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:px-0.5",
        "group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground",
        "group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:-bottom-px",
        "group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:after:rounded-full group-data-[variant=line]/tabs-list:after:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-[state=active]:after:bg-brand",
        // segmented
        "group-data-[variant=segmented]/tabs-list:h-full group-data-[variant=segmented]/tabs-list:rounded-md group-data-[variant=segmented]/tabs-list:px-2.5",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:bg-surface group-data-[variant=segmented]/tabs-list:data-[state=active]:text-foreground",
        "group-data-[variant=segmented]/tabs-list:data-[state=active]:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
