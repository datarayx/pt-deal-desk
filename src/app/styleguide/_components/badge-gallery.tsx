import type * as React from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { dealOutcome, kycStatus, reliability, repaymentStatus } from "@/lib/status";

export function BadgeGallery() {
  return (
    <div className="space-y-4 pt-4">
      <Row label="Repayments">
        <StatusBadge status={repaymentStatus.scheduled} />
        <StatusBadge status={repaymentStatus.due} detail="in 3 days" />
        <StatusBadge status={repaymentStatus.reported} />
        <StatusBadge status={repaymentStatus.confirmed} />
        <StatusBadge status={repaymentStatus.partially_paid} />
        <StatusBadge status={repaymentStatus.overdue} detail="5 days" />
      </Row>
      <Row label="KYC">
        <StatusBadge status={kycStatus.incomplete} />
        <StatusBadge status={kycStatus.submitted} />
        <StatusBadge status={kycStatus.verified} />
      </Row>
      <Row label="Deals">
        <StatusBadge status={dealOutcome.negotiating} />
        <StatusBadge status={dealOutcome.declined_by_lender} />
        <StatusBadge status={dealOutcome.completed} />
        <StatusBadge tone="accent" label="Repaying" />
      </Row>
      <Row label="Reliability">
        <StatusBadge status={reliability.good} />
        <StatusBadge status={reliability.watch} />
        <StatusBadge status={reliability.high_risk} />
      </Row>
      <Row label="Plain badges">
        <Badge>Company</Badge>
        <Badge variant="outline">Individual</Badge>
        <Badge variant="accent">Mining</Badge>
        <Badge variant="brand">CEO</Badge>
        <Badge variant="warning">3 deficiencies</Badge>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[96px_1fr] sm:items-center">
      <span className="text-caption font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
