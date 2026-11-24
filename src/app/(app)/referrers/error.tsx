"use client";

import { RouteError } from "@/components/common/route-error";

export default function ReferrersError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="Referrers" reset={reset} />;
}
