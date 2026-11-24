/** Thin geometric lines and a restrained aqua glow behind the brand story. Purely decorative. */
export function BrandBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-32 right-[-12%] size-[560px] rounded-full bg-[radial-gradient(circle,rgb(0_230_208/0.28)_0%,rgb(0_230_208/0.08)_38%,transparent_70%)]" />
      <div className="absolute bottom-[-18%] left-[-10%] size-[520px] rounded-full bg-[radial-gradient(circle,rgb(3_74_89/0.55)_0%,transparent_65%)]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="auth-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00E6D0" stopOpacity="0" />
            <stop offset="0.55" stopColor="#00E6D0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#00F5D4" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="auth-line-faint" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#00E6D0" stopOpacity="0" />
            <stop offset="1" stopColor="#00E6D0" stopOpacity="0.28" />
          </linearGradient>
          <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" stroke="#ffffff" strokeOpacity="0.035" />
          </pattern>
        </defs>
        <rect width="800" height="900" fill="url(#auth-grid)" />
        <path
          d="M-20 205H470C520 205 548 190 580 158L760 -20"
          stroke="url(#auth-line)"
          strokeWidth="1.5"
        />
        <path d="M60 330 330 60" stroke="url(#auth-line-faint)" />
        <path
          d="M-20 820H560C610 820 640 806 672 774L820 626"
          stroke="url(#auth-line)"
          strokeWidth="1.5"
        />
        <path d="M520 900 760 660" stroke="url(#auth-line-faint)" />
        <path d="M700 900 820 780" stroke="url(#auth-line-faint)" />
      </svg>
      {/* Hairline down the seam to the light panel */}
      <div className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-auth-aqua/25 to-transparent lg:block" />
    </div>
  );
}
