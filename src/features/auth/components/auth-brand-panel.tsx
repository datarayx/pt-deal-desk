import Image from "next/image";

// Right half of the sign-in screens (SCREENS.md: "calm brand panel right"). DESIGN.md §2 allows
// the cyan→mint brand gradient here and on the logo only.

const facts = [
  { value: "Clients & KYC", label: "CIS, directors, documents and credit checks in one record" },
  { value: "Every deal", label: "From enquiry to the last confirmed repayment" },
  { value: "Books that balance", label: "Fees recognised automatically, statements on demand" },
];

export function AuthBrandPanel() {
  return (
    <aside
      aria-hidden
      className="relative hidden overflow-hidden bg-kpi-hero text-kpi-hero-foreground lg:flex lg:flex-col"
    >
      {/* Brand gradient: thin top rule + a soft glow behind the mark */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-mint" />
      <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-gradient-to-br from-brand-cyan/25 to-brand-mint/10 blur-3xl" />

      <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
        <Image
          src="/brand/mark.png"
          alt=""
          width={639}
          height={383}
          priority
          className="h-auto w-24"
        />

        <div className="max-w-md space-y-8">
          <p className="text-display text-white">
            Every client, deal and naira P&amp;T arranges — in one place.
          </p>
          <dl className="space-y-5">
            {facts.map((fact) => (
              <div key={fact.value} className="border-l-2 border-brand-mint/70 pl-4">
                <dt className="text-body font-semibold text-white">{fact.value}</dt>
                <dd className="text-small text-kpi-hero-muted">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-caption text-kpi-hero-muted">P&amp;T Finance Consult Limited</p>
      </div>
    </aside>
  );
}
