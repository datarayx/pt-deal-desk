import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  BellRingIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarClockIcon,
  ChartColumnIcon,
  FileSpreadsheetIcon,
  HandshakeIcon,
  KanbanSquareIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LockIcon,
  type LucideIcon,
  MailIcon,
  NotebookPenIcon,
  PhoneCallIcon,
  ReceiptIcon,
  SettingsIcon,
  TagsIcon,
  UserRoundCogIcon,
  UsersRoundIcon,
  WalletCardsIcon,
  WorkflowIcon,
  ListChecksIcon,
  ScrollTextIcon,
  UploadCloudIcon,
} from "lucide-react";

// Single source of truth for the app's navigation (SCREENS.md). Drives the sidebar, the mobile
// drawer, the ⌘K palette and the top-bar page title. `roles` is enforced for real in task 0.5
// (proxy + RLS); here it only decides what is shown.

import type { Role } from "@/lib/auth/access";

export type { Role };

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: readonly Role[];
  /** Extra words the ⌘K palette matches on. */
  keywords?: readonly string[];
};

export type NavSection = {
  id: string;
  /** Section label in the sidebar. Omitted for the top group. */
  title?: string;
  items: readonly NavItem[];
};

const CEO = ["ceo"] as const;
const BOTH = ["ceo", "accountant"] as const;

/** Main sidebar sections, top to bottom. */
export const navSections: readonly NavSection[] = [
  {
    id: "main",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
        roles: CEO,
        keywords: ["dashboard", "home", "kpi"],
      },
      {
        title: "Clients",
        href: "/clients",
        icon: UsersRoundIcon,
        roles: CEO,
        keywords: ["kyc", "companies", "individuals", "obligor"],
      },
      {
        title: "Deals",
        href: "/deals",
        icon: KanbanSquareIcon,
        roles: CEO,
        keywords: ["pipeline", "kanban", "facility"],
      },
      {
        title: "Repayments",
        href: "/repayments",
        icon: CalendarClockIcon,
        roles: CEO,
        keywords: ["instalments", "due", "overdue"],
      },
      {
        title: "Follow-ups",
        href: "/follow-ups",
        icon: PhoneCallIcon,
        roles: CEO,
        keywords: ["calls", "tasks", "promise to pay"],
      },
      {
        title: "Data import",
        href: "/imports",
        icon: UploadCloudIcon,
        roles: BOTH,
        keywords: ["bulk", "migration", "excel", "workbook", "upload"],
      },
    ],
  },
  {
    id: "partners",
    title: "Partners",
    items: [
      {
        title: "Referrers",
        href: "/referrers",
        icon: HandshakeIcon,
        roles: CEO,
        keywords: ["referral", "consultants"],
      },
      {
        title: "Financiers",
        href: "/financiers",
        icon: LandmarkIcon,
        roles: CEO,
        keywords: ["banks", "finance houses", "lenders"],
      },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      {
        title: "Finance overview",
        href: "/finance",
        icon: ChartColumnIcon,
        roles: BOTH,
        keywords: ["accountant", "cash"],
      },
      {
        title: "Fee receivables",
        href: "/finance/receivables",
        icon: BanknoteArrowDownIcon,
        roles: BOTH,
        keywords: ["commission", "fees", "receipt"],
      },
      {
        title: "Payables",
        href: "/finance/payables",
        icon: BanknoteArrowUpIcon,
        roles: BOTH,
        keywords: ["referral fees", "bills", "payment"],
      },
      {
        title: "Journals",
        href: "/finance/journals",
        icon: NotebookPenIcon,
        roles: BOTH,
        keywords: ["journal entry", "manual journal"],
      },
      {
        title: "Expenses & receipts",
        href: "/finance/transactions",
        icon: ReceiptIcon,
        roles: BOTH,
        keywords: ["transactions", "expense"],
      },
      {
        title: "Chart of accounts",
        href: "/finance/accounts",
        icon: BookOpenIcon,
        roles: BOTH,
        keywords: ["accounts", "coa"],
      },
      {
        title: "General ledger",
        href: "/finance/ledger",
        icon: ScrollTextIcon,
        roles: BOTH,
        keywords: ["ledger", "gl"],
      },
      {
        title: "Reports",
        href: "/finance/reports",
        icon: FileSpreadsheetIcon,
        roles: BOTH,
        keywords: [
          "trial balance",
          "profit or loss",
          "balance sheet",
          "cash flow",
          "financial position",
        ],
      },
      {
        title: "Period close",
        href: "/finance/periods",
        icon: LockIcon,
        roles: BOTH,
        keywords: ["lock", "month end"],
      },
    ],
  },
];

/** Pinned to the bottom of the sidebar. */
export const footerNav: readonly NavItem[] = [
  {
    title: "Outbox",
    href: "/outbox",
    icon: MailIcon,
    roles: CEO,
    keywords: ["emails", "reminders"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    roles: CEO,
    keywords: ["preferences", "configuration"],
  },
];

/** Settings sub-navigation (SCREENS.md `/settings/*`). */
export const settingsNav: readonly NavItem[] = [
  {
    title: "Users & roles",
    href: "/settings/users",
    icon: UserRoundCogIcon,
    roles: CEO,
    keywords: ["invite"],
  },
  {
    title: "Notification recipients",
    href: "/settings/recipients",
    icon: BellRingIcon,
    roles: CEO,
    keywords: ["emails", "alerts"],
  },
  {
    title: "Reminder timings",
    href: "/settings/reminders",
    icon: CalendarClockIcon,
    roles: CEO,
    keywords: ["days before due"],
  },
  {
    title: "Deal stages",
    href: "/settings/stages",
    icon: WorkflowIcon,
    roles: CEO,
    keywords: ["pipeline"],
  },
  {
    title: "Facility types",
    href: "/settings/facility-types",
    icon: TagsIcon,
    roles: CEO,
    keywords: ["lpo", "asset finance"],
  },
  {
    title: "KYC checklists",
    href: "/settings/kyc-checklists",
    icon: ListChecksIcon,
    roles: CEO,
    keywords: ["documents", "cis"],
  },
  {
    title: "Fee defaults",
    href: "/settings/fees",
    icon: WalletCardsIcon,
    roles: CEO,
    keywords: ["commission", "vat", "wht"],
  },
  {
    title: "Company profile",
    href: "/settings/company",
    icon: BuildingIcon,
    roles: CEO,
    keywords: ["branding", "logo", "letterhead"],
  },
];

/** Every navigable page, flattened. */
export const allNavItems: readonly NavItem[] = [
  ...navSections.flatMap((s) => s.items),
  ...footerNav,
  ...settingsNav,
];

/** Pages that are not in the sidebar but still need a title (detail and create pages). */
const extraTitles: readonly { pattern: RegExp; title: string; parent: string }[] = [
  { pattern: /^\/clients\/new$/, title: "New client", parent: "/clients" },
  { pattern: /^\/clients\/[^/]+$/, title: "Client", parent: "/clients" },
  { pattern: /^\/deals\/[^/]+$/, title: "Deal", parent: "/deals" },
  { pattern: /^\/referrers\/[^/]+$/, title: "Referrer", parent: "/referrers" },
  { pattern: /^\/financiers\/[^/]+$/, title: "Financier", parent: "/financiers" },
  { pattern: /^\/imports$/, title: "Data import", parent: "/imports" },
];

export type Crumb = { title: string; href?: string };

/** True when `href` is the active nav item for `pathname` (exact, or a child route). */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/finance") return pathname === "/finance"; // the other /finance/* items own their pages
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Breadcrumb for the top bar, e.g. [Clients, New client] or [Settings, Deal stages]. */
export function getBreadcrumb(pathname: string): Crumb[] {
  const settings = settingsNav.find((item) => pathname === item.href);
  if (settings) return [{ title: "Settings", href: "/settings" }, { title: settings.title }];

  const extra = extraTitles.find((e) => e.pattern.test(pathname));
  if (extra) {
    const parent = allNavItems.find((item) => item.href === extra.parent);
    return [{ title: parent?.title ?? "", href: extra.parent }, { title: extra.title }];
  }

  const exact = allNavItems.find((item) => item.href === pathname);
  if (exact) {
    const section = navSections.find((s) => s.items.includes(exact));
    return section?.title
      ? [{ title: section.title }, { title: exact.title }]
      : [{ title: exact.title }];
  }
  return [];
}

/** Nav visible to a role. */
export function sectionsForRole(role: Role): NavSection[] {
  return navSections
    .map((section) => ({ ...section, items: section.items.filter((i) => i.roles.includes(role)) }))
    .filter((section) => section.items.length > 0);
}

export function footerNavForRole(role: Role): NavItem[] {
  return footerNav.filter((item) => item.roles.includes(role));
}

