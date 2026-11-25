// Placeholder card while a form that reads the URL (?next, ?error) streams in.
export function AuthFormSkeleton() {
  const bar = "animate-pulse rounded-[11px] bg-[#e8eef4] motion-reduce:animate-none";
  return (
    <div
      className="w-full max-w-[480px] rounded-2xl border border-auth-border/80 bg-white p-6 shadow-[0_16px_40px_-16px_rgb(3_27_51/0.18)] sm:p-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className={`${bar} h-9 w-48`} />
      <div className={`${bar} mt-3 h-4 w-72 max-w-full`} />
      <div className="mt-7 space-y-4">
        <div className={`${bar} h-13`} />
        <div className={`${bar} h-13`} />
        <div className={`${bar} h-13 bg-[#d5dee8]`} />
      </div>
    </div>
  );
}
