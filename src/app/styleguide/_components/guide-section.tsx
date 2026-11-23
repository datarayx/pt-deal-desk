import type * as React from "react";

export function GuideSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-4">
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="text-h2 text-foreground">
          {title}
        </h2>
        {description && <p className="max-w-3xl text-body text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
