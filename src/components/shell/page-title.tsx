"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { getBreadcrumb } from "@/lib/navigation";

// Top-bar breadcrumb, e.g. "Finance › Reports" or "Clients › New client".
export function PageTitle() {
  const crumbs = getBreadcrumb(usePathname());
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-small">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.title}-${index}`}>
              {index > 0 && (
                <li aria-hidden className="text-muted-foreground/60">
                  <ChevronRightIcon className="size-3.5" />
                </li>
              )}
              <li
                className={
                  last ? "min-w-0 truncate font-medium text-foreground" : "hidden shrink-0 sm:block"
                }
              >
                {crumb.href && !last ? (
                  <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                    {crumb.title}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={last ? undefined : "text-muted-foreground"}
                  >
                    {crumb.title}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
