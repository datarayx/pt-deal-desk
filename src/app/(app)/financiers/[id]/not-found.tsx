import { LandmarkIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={<LandmarkIcon />}
      title="We couldn't find that financier"
      description="It may have been deleted, or the link is wrong."
      action={
        <Button asChild variant="outline">
          <Link href="/financiers">Back to financiers</Link>
        </Button>
      }
    />
  );
}
