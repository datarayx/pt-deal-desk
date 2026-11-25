"use client";

import { RouteError } from "@/components/common/route-error";

export default function AppError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError what="This screen" reset={reset} />;
}
