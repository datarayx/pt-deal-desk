import {
  ActivityIcon,
  Building2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PhoneCallIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

import { DateText } from "@/components/common/date-text";
import { DetailList } from "@/components/common/detail-list";
import { EmptyState } from "@/components/common/empty-state";
import { MoneyText } from "@/components/common/money-text";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clientTypeLabel,
  companyTypeLabel,
  directorRoleLabel,
  enquirySourceLabel,
} from "@/features/clients/options";
import type { Client360 } from "@/features/clients/queries";
import { dealOutcome, repaymentStatus } from "@/lib/status";

const dash = <span className="text-muted-foreground">—</span>;
const muted = (value: string | null | undefined) => value || dash;

export function Client360Overview({ data }: { data: Client360 }) {
  const { client, summary, companyProfile, individualProfile, reliability } = data;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Active deals</CardDescription>
            <CardTitle className="num text-display">{summary.active_deals}</CardTitle>
          </CardHeader>
          <CardContent className="text-small text-muted-foreground">
            {summary.deal_count} total deals
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total outstanding</CardDescription>
            <CardTitle className="text-display">
              <MoneyText value={reliability.outstanding} compact />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-small text-muted-foreground">
            Across repayment schedules
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>On-time payments</CardDescription>
            <CardTitle className="num text-display">
              {reliability.on_time_percent === null ? "—" : `${reliability.on_time_percent}%`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-small text-muted-foreground">
            {reliability.average_days_late === null
              ? "No payment history yet"
              : `${reliability.average_days_late} average days late`}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>KYC documents</CardDescription>
            <CardTitle className="num text-display">
              {summary.received_docs}/{summary.required_docs}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-small text-muted-foreground">
            Required documents received
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reliability</CardTitle>
          <CardDescription>
            Payment behaviour, defaults and external credit exposure.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-caption text-muted-foreground">Current overdue</p>
            <p className="mt-1 text-h2">
              <MoneyText
                value={reliability.current_overdue_amount ?? reliability.outstanding}
                compact
              />
            </p>
            <p className="mt-1 text-small text-muted-foreground">
              {reliability.max_overdue_days} maximum days overdue
            </p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">Defaults</p>
            <p className="mt-1 num text-h2">{reliability.default_count}</p>
            <p className="mt-1 text-small text-muted-foreground">Recorded defaulted deals</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">External exposure</p>
            <p className="mt-1 text-h2">
              <MoneyText value={reliability.external_exposure} compact />
            </p>
            <p className="mt-1 text-small text-muted-foreground">Open external facilities</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">Latest bureau</p>
            <p className="mt-1 text-h2">{reliability.latest_rating ?? "—"}</p>
            <p className="mt-1 text-small text-muted-foreground">
              {reliability.latest_bureau ?? "No bureau check yet"}
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client details</CardTitle>
            <CardDescription>Core identity and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DetailList
              rows={[
                { label: "Type", value: clientTypeLabel[client.client_type] },
                { label: "Sector", value: muted(client.sector) },
                { label: "Enquiry source", value: enquirySourceLabel[client.enquiry_source] },
                {
                  label: "Referrer",
                  value: summary.referrer_id ? (
                    <Link
                      href={`/referrers/${summary.referrer_id}`}
                      className="text-accent-ink hover:underline"
                    >
                      {summary.referrer_name}
                    </Link>
                  ) : (
                    dash
                  ),
                },
                {
                  label: "Phone",
                  value: summary.phone ? (
                    <a
                      href={`tel:${summary.phone}`}
                      className="num hover:text-accent-ink hover:underline"
                    >
                      {summary.phone}
                    </a>
                  ) : (
                    dash
                  ),
                },
                {
                  label: "Email",
                  value: summary.email ? (
                    <a
                      href={`mailto:${summary.email}`}
                      className="hover:text-accent-ink hover:underline"
                    >
                      {summary.email}
                    </a>
                  ) : (
                    dash
                  ),
                },
                { label: "Added", value: <DateText value={client.created_at} /> },
                { label: "Notes", value: muted(client.notes) },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {client.client_type === "company" ? "Company profile" : "Individual profile"}
            </CardTitle>
            <CardDescription>Details captured during onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {client.client_type === "company" && companyProfile ? (
              <DetailList
                rows={[
                  { label: "Registered name", value: companyProfile.registered_name },
                  { label: "Company type", value: companyTypeLabel[companyProfile.company_type] },
                  {
                    label: "CAC number",
                    value: <span className="num">{muted(companyProfile.rc_number)}</span>,
                  },
                  { label: "TIN", value: <span className="num">{muted(companyProfile.tin)}</span> },
                  { label: "Registered address", value: muted(companyProfile.registered_address) },
                  { label: "Operating address", value: muted(companyProfile.operating_address) },
                  { label: "Contact person", value: muted(companyProfile.contact_person) },
                  {
                    label: "Website",
                    value: companyProfile.website ? (
                      <a
                        href={companyProfile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-ink hover:underline"
                      >
                        {companyProfile.website}
                      </a>
                    ) : (
                      dash
                    ),
                  },
                ]}
              />
            ) : individualProfile ? (
              <DetailList
                rows={[
                  {
                    label: "Full name",
                    value: [
                      individualProfile.title,
                      individualProfile.first_name,
                      individualProfile.middle_name,
                      individualProfile.last_name,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  },
                  {
                    label: "Date of birth",
                    value: <DateText value={individualProfile.date_of_birth} />,
                  },
                  {
                    label: "BVN",
                    value: (
                      <span className="num tracking-wider">
                        {individualProfile.bvn
                          ? `${"*".repeat(7)}${individualProfile.bvn.slice(-4)}`
                          : "—"}
                      </span>
                    ),
                  },
                  {
                    label: "NIN",
                    value: (
                      <span className="num tracking-wider">
                        {individualProfile.nin
                          ? `${"*".repeat(7)}${individualProfile.nin.slice(-4)}`
                          : "—"}
                      </span>
                    ),
                  },
                  { label: "ID document", value: muted(individualProfile.id_type) },
                  { label: "Address", value: muted(individualProfile.residential_address) },
                  { label: "Occupation", value: muted(individualProfile.occupation) },
                  {
                    label: "PEP",
                    value: individualProfile.is_pep ? (
                      <StatusBadge tone="warning" label="Yes" />
                    ) : (
                      "No"
                    ),
                  },
                ]}
              />
            ) : (
              <EmptyState
                variant="plain"
                title="Profile not found"
                description="The client profile details have not been captured."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Client360Directors({ data }: { data: Client360 }) {
  if (data.client.client_type === "individual") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Individual client</CardTitle>
          <CardDescription>
            This client does not have a separate directors register.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body">
            The individual profile is available in the Overview and KYC tabs.
          </p>
        </CardContent>
      </Card>
    );
  }
  if (data.directors.length === 0)
    return (
      <EmptyState
        icon={<UserIcon />}
        title="No directors recorded"
        description="Add directors from the client onboarding flow."
      />
    );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.directors.map((director) => (
        <Card key={director.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="size-4 text-muted-foreground" />
                  {director.profile.first_name}{" "}
                  {director.profile.middle_name ? `${director.profile.middle_name} ` : ""}
                  {director.profile.last_name}
                </CardTitle>
                <CardDescription>{directorRoleLabel[director.role]}</CardDescription>
              </div>
              {director.shareholding_pct !== null && (
                <span className="num text-body font-medium">{director.shareholding_pct}%</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DetailList
              rows={[
                { label: "Phone", value: muted(director.profile.phone) },
                { label: "Email", value: muted(director.profile.email) },
                {
                  label: "BVN",
                  value: (
                    <span className="num tracking-wider">
                      {director.profile.bvn
                        ? `${"*".repeat(7)}${director.profile.bvn.slice(-4)}`
                        : "—"}
                    </span>
                  ),
                },
                {
                  label: "NIN",
                  value: (
                    <span className="num tracking-wider">
                      {director.profile.nin
                        ? `${"*".repeat(7)}${director.profile.nin.slice(-4)}`
                        : "—"}
                    </span>
                  ),
                },
                { label: "Address", value: muted(director.profile.residential_address) },
              ]}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Client360Deals({ data }: { data: Client360 }) {
  if (data.deals.length === 0)
    return (
      <EmptyState
        icon={<Building2Icon />}
        title="No deals yet"
        description="Deals linked to this client will appear here."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals</CardTitle>
        <CardDescription>
          {data.deals.length} deal{data.deals.length === 1 ? "" : "s"} linked to this client.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead className="border-b border-border bg-surface-subtle text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Facility</th>
                <th className="px-5 py-3 font-medium">Financier</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-accent-ink hover:underline"
                    >
                      {deal.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{deal.facility_type ?? "—"}</td>
                  <td className="px-5 py-3">{deal.financier_name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: deal.stage_color ?? "var(--muted-foreground)" }}
                      />
                      {deal.stage_name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyText
                      value={deal.amount_disbursed ?? deal.amount_approved ?? deal.amount_requested}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={dealOutcome[deal.outcome]} />
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

export function Client360Repayments({ data }: { data: Client360 }) {
  const dealRefs = new Map(data.deals.map((deal) => [deal.id, deal.reference]));
  const reportCount = new Map<string, number>();
  for (const report of data.reports)
    reportCount.set(report.schedule_id, (reportCount.get(report.schedule_id) ?? 0) + 1);
  if (data.schedules.length === 0)
    return (
      <EmptyState
        icon={<CalendarClockIcon />}
        title="No repayment schedule yet"
        description="A schedule will appear when a linked deal is disbursed."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repayments</CardTitle>
        <CardDescription>Instalments across all deals for this client.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead className="border-b border-border bg-surface-subtle text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Deal</th>
                <th className="px-5 py-3 font-medium">Instalment</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-5 py-3 font-medium">{dealRefs.get(schedule.deal_id) ?? "—"}</td>
                  <td className="px-5 py-3 num">#{schedule.instalment_no}</td>
                  <td className="px-5 py-3">
                    <DateText value={schedule.due_date} />
                    {schedule.days_overdue > 0 && (
                      <span className="ml-2 text-danger">{schedule.days_overdue}d late</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <MoneyText value={schedule.total_due} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={repaymentStatus[schedule.status]} />
                  </td>
                  <td className="px-5 py-3 num text-muted-foreground">
                    {reportCount.get(schedule.id) ?? 0}
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

const activityIcon = {
  note: FileTextIcon,
  call: PhoneCallIcon,
  email: ActivityIcon,
  meeting: CalendarClockIcon,
  system: CheckCircle2Icon,
} as const;

export function Client360Activity({ activities }: { activities: Client360["activities"] }) {
  if (activities.length === 0)
    return (
      <EmptyState
        icon={<ActivityIcon />}
        title="No activity yet"
        description="Notes, calls and system events for this client will appear here."
      />
    );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity timeline</CardTitle>
        <CardDescription>Latest notes and events for this client.</CardDescription>
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
                  <p className="mt-1 text-body whitespace-pre-wrap text-muted-foreground">
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
