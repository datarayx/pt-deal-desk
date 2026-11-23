import type { Metadata } from "next";

import { BrandMark } from "@/components/common/brand-mark";
import { ThemeToggle } from "@/components/shell/theme-toggle";

import { BadgeGallery } from "./_components/badge-gallery";
import { ButtonGallery } from "./_components/button-gallery";
import { FieldGallery } from "./_components/field-gallery";
import { FormatGallery } from "./_components/format-gallery";
import { GuideSection } from "./_components/guide-section";
import { KpiGallery } from "./_components/kpi-gallery";
import { LayoutGallery } from "./_components/layout-gallery";
import { OverlayDemos } from "./_components/overlay-demos";
import { TableGallery } from "./_components/table-gallery";
import { TabsGallery } from "./_components/tabs-gallery";
import { ThemePair } from "./_components/theme-pair";
import { TokenTable } from "./_components/token-table";
import { TypeSpecimen } from "./_components/type-specimen";
import { tokenGroups } from "./_data/tokens";

export const metadata: Metadata = {
  title: "Design system",
  description: "Tokens and components for P&T Deal Desk, in light and dark mode.",
};

const nav = [
  { id: "colours", label: "Colours" },
  { id: "type", label: "Type" },
  { id: "buttons", label: "Buttons" },
  { id: "fields", label: "Fields" },
  { id: "badges", label: "Badges" },
  { id: "kpis", label: "KPI cards" },
  { id: "tables", label: "Tables" },
  { id: "tabs", label: "Tabs" },
  { id: "layout", label: "Headers & empty states" },
  { id: "overlays", label: "Overlays" },
  { id: "formatting", label: "Money & dates" },
];

export default function StyleguidePage() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-body leading-tight font-semibold">P&amp;T Deal Desk</p>
            <p className="text-caption text-muted-foreground">Design system</p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Sections" className="mx-auto max-w-[1440px] overflow-x-auto px-4 sm:px-6">
          <ul className="flex h-10 items-center gap-5 text-small whitespace-nowrap text-muted-foreground">
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-14 px-4 py-10 sm:px-6">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-h1">Design system</h1>
          <p className="text-body text-muted-foreground">
            Every token and component from{" "}
            <code className="font-mono text-small">docs/DESIGN.md</code>, shown in light and dark
            side by side. Overlays open at page level, so they follow the theme switch in the top
            right.
          </p>
        </div>

        <GuideSection
          id="colours"
          title="Colour tokens"
          description="From the P&T logo. Use the CSS variables or the matching Tailwind classes (bg-brand, text-accent-ink, …) — never raw hex in components."
        >
          <div className="space-y-4">
            {tokenGroups.map((group) => (
              <TokenTable key={group.title} group={group} />
            ))}
          </div>
        </GuideSection>

        <GuideSection
          id="type"
          title="Typography"
          description="Inter. Money, dates and every column of numbers use tabular figures via the num utility, so digits line up."
        >
          <TypeSpecimen />
        </GuideSection>

        <GuideSection
          id="buttons"
          title="Buttons"
          description="One primary (navy) button per view. Outline for everything else. Pending state appears instantly."
        >
          <ThemePair>{() => <ButtonGallery />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="fields"
          title="Form fields"
          description="Inputs and selects share one chrome. Required fields are marked; errors pair a red border with a message."
        >
          <ThemePair>{(mode) => <FieldGallery idPrefix={mode} />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="badges"
          title="Badges & status"
          description="StatusBadge = soft background + dot + label. Colour is never the only signal."
        >
          <ThemePair>{() => <BadgeGallery />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="kpis"
          title="KPI cards"
          description="The navy hero card holds the single most important figure on a screen — one per screen."
        >
          <ThemePair>{() => <KpiGallery />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="tables"
          title="Cards & tables"
          description="44px rows, sticky header, no zebra. Money right-aligned and tabular."
        >
          <ThemePair stacked>{() => <TableGallery />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="tabs"
          title="Tabs"
          description="Line tabs for detail pages; segmented for view toggles."
        >
          <ThemePair>{() => <TabsGallery />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="layout"
          title="Page headers & empty states"
          description="Title and description on the left, the primary action on the right, secondary actions behind “…”."
        >
          <ThemePair>{() => <LayoutGallery />}</ThemePair>
        </GuideSection>

        <GuideSection
          id="overlays"
          title="Sheets, dialogs, menus, tooltips & toasts"
          description="Create/edit forms open in a side sheet. Destructive confirmations name the item. Use the theme switch to see these in dark mode."
        >
          <OverlayDemos />
        </GuideSection>

        <GuideSection
          id="formatting"
          title="Money & dates"
          description="₦ via Intl en-NG from the decimal string (no float maths). Dates as 23 Nov 2026 in Africa/Lagos."
        >
          <ThemePair>{() => <FormatGallery />}</ThemePair>
        </GuideSection>
      </main>
    </div>
  );
}
