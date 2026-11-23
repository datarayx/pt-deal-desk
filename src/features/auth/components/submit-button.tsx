"use client";

import type * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Full-width primary submit with an instant pending state (DESIGN.md §7: feedback within 100ms).
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" pending={pending}>
      {children}
    </Button>
  );
}
