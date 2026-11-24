import type * as React from "react";

/** A titled group of fields inside a step. */
export function FieldSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-body font-semibold">{title}</h3>
        {description && <p className="text-small text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
