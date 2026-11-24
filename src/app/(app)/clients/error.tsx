"use client";

import { RouteError } from "@/components/common/route-error";

export default function ClientsError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="Clients" reset={reset} />;
}
