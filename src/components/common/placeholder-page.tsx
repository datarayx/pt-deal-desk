import { HardHatIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

// Stand-in for screens that are not built yet. Says what the screen will hold and which task in
// TASKS.md builds it, so nobody mistakes a placeholder for a bug during the demo build-up.

type PlaceholderPageProps = {
  title: string;
  description: string;
  /** TASKS.md number, e.g. "2.4". */
  task: string;
  /** What the finished screen will contain (from SCREENS.md). */
  contents: string;
  /** "page" renders a full page header; "section" sits inside a parent layout (Settings). */
  level?: "page" | "section";
};

export function PlaceholderPage({
  title,
  description,
  task,
  contents,
  level = "page",
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      {level === "page" ? (
        <PageHeader title={title} description={description} />
      ) : (
        <div className="space-y-1">
          <h2 className="text-h2">{title}</h2>
          <p className="text-body text-muted-foreground">{description}</p>
        </div>
      )}
      <EmptyState
        icon={<HardHatIcon />}
        title={`Built in task ${task}`}
        description={contents}
        className="py-16"
      />
    </div>
  );
}
