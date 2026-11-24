"use client";

import { RouteError } from "@/components/common/route-error";

export default function FinanciersError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="Financiers" reset={reset} />;
}
