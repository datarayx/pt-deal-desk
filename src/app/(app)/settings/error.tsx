"use client";

import { RouteError } from "@/components/common/route-error";

export default function SettingsError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="This section" reset={reset} />;
}
