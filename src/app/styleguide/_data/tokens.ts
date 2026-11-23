// Token inventory shown on /styleguide. Values mirror src/app/globals.css (DESIGN.md §3).

export type TokenRow = {
  /** CSS variable name without the leading dashes. */
  name: string;
  light: string;
  dark: string;
  use: string;
  /** Show the swatch on a navy tile (cyan/mint are only allowed on navy). */
  onNavy?: boolean;
};

export type TokenGroup = { title: string; note?: string; tokens: TokenRow[] };

export const tokenGroups: TokenGroup[] = [
  {
    title: "Brand",
    note: "Navy is the workhorse. Cyan and mint appear only on navy surfaces.",
    tokens: [
      { name: "brand", light: "#011A32", dark: "#00F6F1", use: "Primary buttons, selected states" },
      { name: "brand-foreground", light: "#FFFFFF", dark: "#011A32", use: "Text on brand" },
      { name: "brand-hover", light: "#0B2A47", dark: "#5BFAF6", use: "Hover on brand" },
      {
        name: "brand-cyan",
        light: "#00F6F1",
        dark: "#00F6F1",
        use: "Spark — navy only",
        onNavy: true,
      },
      {
        name: "brand-mint",
        light: "#00EAA2",
        dark: "#00EAA2",
        use: "Spark — navy only",
        onNavy: true,
      },
      { name: "brand-teal", light: "#00B29E", dark: "#00B29E", use: "Logo shadow face, charts" },
    ],
  },
  {
    title: "Sidebar",
    tokens: [
      { name: "sidebar", light: "#011A32", dark: "#020F1E", use: "Sidebar background" },
      {
        name: "sidebar-text",
        light: "#C9D6E3",
        dark: "#C9D6E3",
        use: "Sidebar items",
        onNavy: true,
      },
      { name: "sidebar-active", light: "#0B2A47", dark: "#0B2A47", use: "Active nav item" },
      {
        name: "sidebar-indicator",
        light: "#00F6F1",
        dark: "#00F6F1",
        use: "3px active bar",
        onNavy: true,
      },
    ],
  },
  {
    title: "Surfaces & text",
    tokens: [
      { name: "background", light: "#F4F7F9", dark: "#06121F", use: "App background" },
      { name: "surface", light: "#FFFFFF", dark: "#0B1E33", use: "Cards, tables, sheets" },
      { name: "surface-raised", light: "#FFFFFF", dark: "#102742", use: "Popovers, dialogs" },
      {
        name: "surface-subtle",
        light: "#EEF2F6",
        dark: "#132B47",
        use: "Hover, soft fills (derived)",
      },
      { name: "border", light: "#E3E8EE", dark: "#1B3350", use: "Dividers, inputs" },
      { name: "border-strong", light: "#CFD8E1", dark: "#27466A", use: "Input hover (derived)" },
      { name: "text", light: "#0B1B2B", dark: "#E6EEF5", use: "Primary text" },
      {
        name: "muted-foreground",
        light: "#5B6B7B",
        dark: "#93A4B6",
        use: "Secondary text (DESIGN --muted)",
      },
      {
        name: "accent-ink",
        light: "#00796F",
        dark: "#00EAA2",
        use: "Links, positive (DESIGN --accent)",
      },
      { name: "accent-soft", light: "#E6F7F3", dark: "#0A2E2B", use: "Soft accent background" },
      { name: "focus-ring", light: "#00B29E", dark: "#00F6F1", use: "Focus outline (2px)" },
    ],
  },
  {
    title: "Status",
    note: "Always paired with a label or icon — never colour alone.",
    tokens: [
      { name: "success", light: "#047857", dark: "#34D399", use: "Paid, confirmed, approved" },
      { name: "warning", light: "#B45309", dark: "#FBBF24", use: "Due soon, pending, deficiency" },
      { name: "danger", light: "#B91C1C", dark: "#F87171", use: "Overdue, declined, default" },
      { name: "info", light: "#1D4ED8", dark: "#60A5FA", use: "Informational" },
      { name: "success-soft", light: "#ECFDF5", dark: "#0B2E26", use: "Badge background" },
      { name: "warning-soft", light: "#FEF3C7", dark: "#2E2410", use: "Badge background" },
      { name: "danger-soft", light: "#FEE2E2", dark: "#331519", use: "Badge background" },
      { name: "info-soft", light: "#EFF6FF", dark: "#11264A", use: "Badge background" },
    ],
  },
  {
    title: "Charts",
    note: "Use in order, max 4 per chart. Series 1 becomes light slate in dark mode.",
    tokens: [
      { name: "chart-1", light: "#011A32", dark: "#C9D6E3", use: "Navy" },
      { name: "chart-2", light: "#00B29E", dark: "#00B29E", use: "Deep teal" },
      { name: "chart-3", light: "#00EAA2", dark: "#00EAA2", use: "Mint" },
      { name: "chart-4", light: "#7C93AB", dark: "#7C93AB", use: "Slate" },
      { name: "chart-5", light: "#C9D6E3", dark: "#3D5A78", use: "Light slate" },
    ],
  },
];
