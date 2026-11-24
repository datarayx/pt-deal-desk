import {
  ActivityIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  LandmarkIcon,
  PhoneCallIcon,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { DateText } from "@/components/common/date-text";
import { DetailList } from "@/components/common/detail-list";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DealDetail } from "@/features/deals/detail-queries";
import { sumDecimalStrings } from "@/lib/money/decimal";
import { dealOutcome, repaymentStatus } from "@/lib/status";

const dash = <span className="text-muted-foreground">—</span>;
const muted = (value: string | null | undefined) => value || dash;

export function DealOverview({ data }: { data: DealDetail }) {
  const { deal, stage, requirements, schedules } = data;
  const amount = deal.amount_disbursed ?? deal.amount_approved ?? deal.amount_requested;
  const amountLabel = deal.amount_disbursed
    ? "Disbursed"
    : deal.amount_approved
      ? "Approved"
      : "Requested";
  const deficiencies = requirements.filter(
    (item) => item.is_required && item.status === "pending",
  ).length;
  const nextDue = schedules.find((item) => item.status !== "confirmed");
  const outstanding = sumDecimalStrings(
    schedules.filter((item) => item.status !== "confirmed").map((item) => item.total_due),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={amountLabel}
          value={<MoneyText value={amount} compact />}
          sub="Best current deal amount"
        />
        <Kpi
          label="Stage"
          value={<span>{stage.name}</span>}
          sub={`${stage.sort_order} in pipeline`}
        />
        <Kpi
          label="Next due"
          value={nextDue ? <DateText value={nextDue.due_date} /> : <span>—</span>}
          sub={nextDue ? <MoneyText value={nextDue.total_due} /> : "No repayment schedule yet"}
        />
        <Kpi
          label="Deficiencies"
          value={<span className="num">{deficiencies}</span>}
          sub="Required items still pending"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deal details</CardTitle>
            <CardDescription>Commercial terms and ownership for this facility.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DetailList
              rows={[
                {
                  label: "Client",
                  value: (
                    <Link
                      href={`/clients/${deal.client_id}`}
                      className="text-accent-ink hover:underline"
                    >
                      {deal.client_name}
                    </Link>
                  ),
                },
                { label: "Financier", value: deal.financier_name ?? muted(null) },
                { label: "Facility", value: deal.facility_type ?? muted(null) },
                { label: "Referrer", value: deal.referrer_name ?? muted(null) },
                { label: "Outcome", value: <StatusBadge status={dealOutcome[deal.outcome]} /> },
                { label: "Opened", value: <DateText value={deal.created_at} /> },
                {
                  label: "Stage entered",
                  value: <DateText value={deal.stage_entered_at} withTime />,
                },
                {
                  label: "Purpose",
                  value: deal.purpose ? (
                    <span className="whitespace-pre-line">{deal.purpose}</span>
                  ) : (
                    muted(null)
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Facility terms</CardTitle>
            <CardDescription>Amount, rate, tenor and security information.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DetailList
              rows={[
                { label: "Amount requested", value: <MoneyText value={deal.amount_requested} /> },
                { label: "Amount approved", value: <MoneyText value={deal.amount_approved} /> },
                { label: "Amount disbursed", value: <MoneyText value={deal.amount_disbursed} /> },
                {
                  label: "Interest / month",
                  value: deal.interest_rate_monthly ? (
                    <span className="num">{deal.interest_rate_monthly}%</span>
                  ) : (
                    muted(null)
                  ),
                },
                {
                  label: "Tenor",
                  value: deal.tenor_months ? (
                    <span className="num">{deal.tenor_months} months</span>
                  ) : (
                    muted(null)
                  ),
                },
                {
                  label: "Collateral",
                  value: deal.collateral_type
                    ? `${deal.collateral_type}${deal.collateral_value ? ` · ${deal.collateral_value}` : ""}`
                    : muted(null),
                },
                {
                  label: "Guarantor",
                  value: deal.guarantor_name
                    ? `${deal.guarantor_name}${deal.guarantor_cheques ? " · cheques provided" : ""}`
                    : muted(null),
                },
                {
                  label: "Other fees",
                  value: deal.other_fees_note ? (
                    <span className="whitespace-pre-line">{deal.other_fees_note}</span>
                  ) : (
                    muted(null)
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {deal.decline_reason && (
        <Card className="border-warning/30 bg-warning-soft/30">
          <CardHeader>
            <CardTitle>
              {deal.outcome === "negotiating" ? "Negotiation note" : "Outcome reason"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body whitespace-pre-line">{deal.decline_reason}</p>
          </CardContent>
        </Card>
      )}

      {deal.disbursement_date && (
        <Card>
          <CardHeader>
            <CardTitle>Repayment setup</CardTitle>
            <CardDescription>
              {deal.repayment_frequency
                ? `${deal.repayment_frequency} repayments`
                : "Repayment frequency not recorded"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DetailList
              rows={[
                { label: "Disbursed", value: <DateText value={deal.disbursement_date} /> },
                { label: "First repayment", value: <DateText value={deal.first_repayment_date} /> },
                { label: "Maturity", value: <DateText value={deal.maturity_date} /> },
                { label: "Scheduled outstanding", value: <MoneyText value={outstanding} /> },
                { label: "Instalments", value: <span className="num">{schedules.length}</span> },
              ]}
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Stage history</CardTitle>
          <CardDescription>Every stage transition is recorded with its note.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-small text-muted-foreground">No stage moves recorded yet.</p>
          ) : (
            <ol className="space-y-4">
              {data.history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-small font-medium">
                      {item.from_stage_name ?? "Opened"}{" "}
                      <span className="px-1 text-muted-foreground">→</span> {item.to_stage_name}
                    </p>
                    {item.note && (
                      <p className="mt-1 text-small text-muted-foreground">{item.note}</p>
                    )}
                  </div>
                  <DateText value={item.changed_at} withTime />
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-display">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-small text-muted-foreground">{sub}</CardContent>
    </Card>
  );
}

export function DealRequirements({ requirements }: { requirements: DealDetail["requirements"] }) {
  const deficiencies = requirements.filter((item) => item.is_required && item.status === "pending");
  if (requirements.length === 0)
    return (
      <EmptyState
        icon={<FileTextIcon />}
        title="No requirements copied"
        description="This deal was opened without a financier requirement checklist."
      />
    );
  return (
    <div className="space-y-4">
      <Card className={deficiencies.length > 0 ? "border-warning/40" : undefined}>
        <CardHeader>
          <CardTitle>Requirements checklist</CardTitle>
          <CardDescription>
            {deficiencies.length > 0
              ? `${deficiencies.length} required ${deficiencies.length === 1 ? "item is" : "items are"} still deficient.`
              : "All required items have been received or waived."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {requirements.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${item.status === "pending" && item.is_required ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}
                  aria-hidden
                >
                  {item.status === "pending" && item.is_required ? "!" : "✓"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small font-medium">{item.item}</p>
                  <p className="text-caption text-muted-foreground">
                    {item.is_required ? "Required" : "Optional"}
                    {item.file_path ? " · File attached" : ""}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    item.status === "pending" && item.is_required
                      ? "warning"
                      : item.status === "received"
                        ? "success"
                        : "neutral"
                  }
                  label={
                    item.status === "pending" && item.is_required
                      ? "Deficient"
                      : item.status === "received"
                        ? "Received"
                        : "Waived"
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DealRepayments({ schedules }: { schedules: DealDetail["schedules"] }) {
  if (schedules.length === 0)
    return (
      <EmptyState
        icon={<CalendarClockIcon />}
        title="No repayment schedule"
        description="Disburse the deal after tenor, rate and first repayment date are set."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repayment schedule</CardTitle>
        <CardDescription>
          {schedules.length} instalments generated from the disbursement terms.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead className="border-b border-border bg-surface-subtle text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Instalment</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 text-right font-medium">Principal</th>
                <th className="px-5 py-3 text-right font-medium">Interest</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 num">#{item.instalment_no}</td>
                  <td className="px-5 py-3">
                    <DateText value={item.due_date} />
                    {item.days_overdue > 0 && (
                      <span className="ml-2 text-danger">{item.days_overdue}d late</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyText value={item.principal_due} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyText value={item.interest_due} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyText value={item.total_due} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={repaymentStatus[item.status]} />
                  </td>
                  <td className="px-5 py-3 num text-muted-foreground">{item.report_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DealFees({ fees }: { fees: DealDetail["fees"] }) {
  if (fees.length === 0)
    return (
      <EmptyState
        icon={<LandmarkIcon />}
        title="No fees recorded"
        description="Fees linked to this deal will appear here."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees</CardTitle>
        <CardDescription>Provider, client and referral fees attached to this deal.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead className="border-b border-border bg-surface-subtle text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Terms</th>
                <th className="px-5 py-3 text-right font-medium">Computed</th>
                <th className="px-5 py-3 font-medium">Trigger</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fees.map((fee) => (
                <tr key={fee.id}>
                  <td className="px-5 py-3 font-medium capitalize">
                    {fee.fee_kind.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-3 num">
                    {fee.basis === "percent" ? `${fee.value}%` : <MoneyText value={fee.value} />}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyText value={fee.computed_amount} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {fee.trigger.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      tone={
                        fee.status === "paid" || fee.status === "received"
                          ? "success"
                          : fee.status === "earned"
                            ? "accent"
                            : "neutral"
                      }
                      label={fee.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DealDocuments({ documents }: { documents: DealDetail["documents"] }) {
  if (documents.length === 0)
    return (
      <EmptyState
        icon={<FileTextIcon />}
        title="No deal documents"
        description="Offer letters, signed documents and other deal files will appear here."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Files attached to this deal.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {documents.map((document) => (
          <div key={document.id} className="flex items-center gap-3 px-5 py-3.5">
            <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium">{document.title}</p>
              <p className="truncate text-caption text-muted-foreground">{document.file_path}</p>
            </div>
            <Badge variant="outline">
              <DateText value={document.created_at} />
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const activityIcon = {
  note: FileTextIcon,
  call: PhoneCallIcon,
  email: ActivityIcon,
  meeting: CalendarClockIcon,
  system: CheckCircle2Icon,
} as const;

export function DealActivity({ activities }: { activities: DealDetail["activities"] }) {
  if (activities.length === 0)
    return (
      <EmptyState
        icon={<ActivityIcon />}
        title="No activity yet"
        description="Stage changes and deal events will appear here."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity timeline</CardTitle>
        <CardDescription>Latest notes, actions and system events for this deal.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-6">
          {activities.map((activity) => {
            const Icon = activityIcon[activity.kind];
            return (
              <li key={activity.id} className="relative flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-subtle text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-small font-medium capitalize">{activity.kind}</p>
                    <DateText value={activity.occurred_at} withTime />
                  </div>
                  <p className="mt-1 text-body whitespace-pre-line text-muted-foreground">
                    {activity.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
