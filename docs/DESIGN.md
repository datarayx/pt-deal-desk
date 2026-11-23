# DESIGN.md — Visual & interaction system

> Goal: a calm, premium fintech product. Reference quality: **Stripe Dashboard, Linear, Mercury, Ramp**. Dense with information but never cluttered. Colours below are taken from the official **P&T Finance Consult Limited** logo (`public/brand/logo.svg`).

## 1. Personality
Trustworthy · precise · calm · modern Nigerian finance. Numbers are the hero. No playful illustrations, no emoji, no purple-blue AI gradients, no glassmorphism.

## 2. Brand colours (from the logo)
| Name | Hex | Where it comes from |
|---|---|---|
| Midnight navy | `#011A32` | Logo tile background |
| Signal cyan | `#00F6F1` | Top face of the logo mark |
| Growth mint | `#00EAA2` | Front face of the logo mark |
| Deep teal | `#00B29E` | Side/shadow face of the logo mark |
| Graphite | `#0B1B2B` | Wordmark (softened from pure black) |
| Slate grey | `#5B6B7B` | "CONSULT LIMITED" line (cooled to match navy) |

### The golden rule
Cyan and mint are **neon** colours. On white they fail contrast (cyan on white = 1.4:1, mint = 1.6:1), so they must **never** be used for text, buttons or thin lines on light backgrounds. They come alive on navy (cyan on navy = 12.5:1). So:
- **Navy is the workhorse:** primary buttons, sidebar, hero KPI card, headings accent.
- **Cyan/mint are the spark:** only on navy surfaces (active nav indicator, logo, KPI deltas on the navy card, focus ring), plus chart fills.
- **Ink teal `#00796F`** is the teal you can use as text on white (5.3:1): links, "Repaying"/positive badges.
- Brand gradient (cyan → mint, as in the mark) is allowed in exactly two places: the logo and the login page brand panel. Nowhere else.

## 3. Colour tokens (CSS variables, light + dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#011A32` | `#00F6F1` | Primary buttons, selected states |
| `--brand-foreground` | `#FFFFFF` | `#011A32` | Text on brand |
| `--brand-hover` | `#0B2A47` | `#5BFAF6` | Hover on brand |
| `--sidebar` | `#011A32` | `#020F1E` | Sidebar background (navy in both modes) |
| `--sidebar-text` | `#C9D6E3` | `#C9D6E3` | Sidebar items |
| `--sidebar-active` | `#0B2A47` + 3px `#00F6F1` left bar | same | Active nav item |
| `--accent` | `#00796F` | `#00EAA2` | Links, positive emphasis |
| `--accent-soft` | `#E6F7F3` | `#0A2E2B` | Soft accent background (badges, selected rows) |
| `--background` | `#F4F7F9` | `#06121F` | App background |
| `--surface` | `#FFFFFF` | `#0B1E33` | Cards, tables, sheets |
| `--surface-raised` | `#FFFFFF` | `#102742` | Popovers, dialogs |
| `--border` | `#E3E8EE` | `#1B3350` | Dividers, inputs |
| `--text` | `#0B1B2B` | `#E6EEF5` | Primary text |
| `--muted` | `#5B6B7B` | `#93A4B6` | Secondary text, labels |
| `--focus-ring` | `#00B29E` | `#00F6F1` | Focus outline (2px) |
| `--success` | `#047857` | `#34D399` | Paid, confirmed, approved |
| `--warning` | `#B45309` | `#FBBF24` | Due soon, pending, deficiency |
| `--danger` | `#B91C1C` | `#F87171` | Overdue, declined, default |
| `--info` | `#1D4ED8` | `#60A5FA` | Informational |

Soft status badges (light mode): success `#ECFDF5`/`#047857`, warning `#FEF3C7`/`#92400E`, danger `#FEE2E2`/`#B91C1C`, info `#EFF6FF`/`#1D4ED8`. Status colours always pair with a text label/icon (never colour alone). Success is deliberately a deeper green than the brand mint so "paid" never looks like decoration.

### Signature component: the navy KPI card
The single most important figure on each dashboard (e.g. pipeline value) sits on a `--sidebar` navy card with white value text and the delta in growth mint `#00EAA2`. Only one per screen.

### Chart palette (in order)
`#011A32` navy · `#00B29E` deep teal · `#00EAA2` mint · `#7C93AB` slate · `#C9D6E3` light slate. Status charts (overdue ageing) use the status colours instead.

## 3b. Typography
- UI font: **Inter** (closest free match to the logo's geometric wordmark; Geist is an alternative). Numbers: `font-variant-numeric: tabular-nums` everywhere money/dates appear.
- Scale: Display 30/36 semibold · H1 24/32 semibold · H2 18/28 semibold · Body 14/20 regular · Small 13/18 · Caption 12/16 muted.
- Money in tables right-aligned; currency symbol ₦ attached; negatives in danger colour with minus sign.

## 4. Layout & spacing
- 4-px grid; common gaps 8 / 12 / 16 / 24 / 32.
- App shell: **left sidebar** (240px, collapsible to icons) + **top bar** (search ⌘K, bell, user menu) + content max-width 1440px.
- Page header: title, short description, primary action on the right, secondary actions in a "…" menu.
- Radius: 8px inputs/buttons, 12px cards, 16px sheets/dialogs. Shadows: subtle (`0 1px 2px rgba(0,0,0,.05)`), borders do most of the work.

## 5. Components (shadcn/ui, restyled with tokens)
- **KPI card**: label (caption, muted), value (Display, tabular), delta or sub-line, optional sparkline.
- **Data table**: sticky header, zebra off, row hover, 44px rows, column visibility toggle, saved filters, bulk select, CSV/Excel/PDF export in toolbar.
- **Status badge**: soft background + dot + label (e.g. ● Overdue 5 days).
- **Kanban** (deals): columns per stage with count + total ₦; cards show client, financier, amount, days in stage, deficiency count.
- **Detail pages**: header with key facts + status, then tabs (Overview · Documents · Repayments · Activity).
- **Side sheet** for create/edit forms; full page only for long KYC forms (multi-step with progress).
- **Timeline** for activity and call logs.
- **Empty states**: one line of guidance + primary action. **Skeleton loaders** for every async block. **Toasts** for success/error.
- **Command palette (⌘K)**: jump to client/deal, quick actions.

## 6. Data visualisation
- Recharts via shadcn charts. Use the chart palette in §2 in order; max 4 colours per chart; status colours only for status.
- Charts: pipeline value by stage (horizontal bar), fees earned vs received by month (bar), repayments due next 30 days (bar), overdue ageing (0–30, 31–60, 61–90, 90+).

## 7. Interaction & quality rules
- Every action gives feedback within 100ms (pending state on buttons).
- Destructive actions confirm with the item name.
- Forms: inline validation, clear required markers, Nigerian formats (phone +234, BVN 11 digits, NIN 11 digits, RC number).
- Keyboard accessible, visible focus rings, WCAG AA contrast.
- Responsive: perfect on laptop (1280–1440); usable on tablet and phone (sidebar becomes drawer, tables become cards).
- Dark mode supported from day one via tokens.

## 8. Don'ts
No default shadcn grey look left untouched · no centered-everything layouts · no oversized hero headings inside the app · no lorem ipsum · no inconsistent button sizes · no more than one primary button per view.
