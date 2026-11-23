import * as React from "react";

import { fieldClassName } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClassName, "h-auto min-h-20 py-2 leading-5", className)}
      {...props}
    />
  );
}

export { Textarea };
