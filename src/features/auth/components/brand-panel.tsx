import { BrandBackdrop } from "@/features/auth/components/brand-backdrop";
import { LogoMark } from "@/features/auth/components/logo-mark";
import { cn } from "@/lib/utils";

const features = [
  { title: "Clients & KYC", text: "CIS, directors, documents and credit checks in one record" },
  { title: "Every deal", text: "From enquiry to the last confirmed repayment" },
  { title: "Books that balance", text: "Fees recognised automatically, statements on demand" },
] as const;

/** Left half of the sign-in screens: logo, the promise, three pillars, company name. */
export function BrandPanel({ className }: { className?: string }) {
  return (
    <section
      aria-label="About P&T Deal Desk"
      className={cn(
        "relative isolate overflow-hidden bg-gradient-to-br from-auth-navy via-auth-navy-2 to-auth-teal text-white",
        className,
      )}
    >
      <BrandBackdrop />
      <div className="relative flex h-full flex-col gap-12 px-6 py-10 sm:px-12 sm:py-14 lg:justify-between lg:gap-10 lg:px-14 lg:py-12 xl:px-20 xl:py-14">
        <LogoMark size={48} className="hidden lg:inline-flex" />

        <div className="max-w-xl space-y-10 lg:space-y-12">
          <h2 className="text-[clamp(2rem,1.2rem+2.6vw,3.35rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance">
            Every client, deal and naira P&amp;T arranges{" "}
            <span className="text-auth-cyan">— in one place.</span>
          </h2>
          <ul className="space-y-6">
            {features.map((f) => (
              <li key={f.title} className="relative pl-5">
                <span
                  className="absolute inset-y-0.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-auth-cyan to-auth-aqua/40"
                  aria-hidden
                />
                <p className="text-[1.0625rem] leading-6 font-semibold">{f.title}</p>
                <p className="mt-1 text-[0.9375rem] leading-6 text-auth-on-navy">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-auth-on-navy">P&amp;T Finance Consult Limited</p>
      </div>
    </section>
  );
}
