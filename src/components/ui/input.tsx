import { cn } from "@/lib/utils";
import * as React from "react";

import { fieldClassName } from "@/components/ui/styles";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClassName,
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-foreground",
        type === "number" && "num",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
