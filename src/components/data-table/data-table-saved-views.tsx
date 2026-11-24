"use client";

import { BookmarkIcon, CheckIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { deleteView, saveView } from "@/features/saved-views/actions";
import type { SavedView, ViewState } from "@/features/saved-views/schemas";

/** "Views" menu: apply a saved view, save the current state, delete the active one. */
export function DataTableSavedViews({
  tableKey,
  views,
  activeViewId,
  currentState,
  onApply,
}: {
  tableKey: string;
  views: SavedView[];
  activeViewId: string | null;
  currentState: () => ViewState;
  onApply: (view: SavedView | null) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = views.find((v) => v.id === activeViewId) ?? null;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveView({ tableKey, name, state: currentState() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`View “${name.trim()}” saved`);
      setDialogOpen(false);
      onApply({ id: result.data?.id ?? "", name: name.trim(), state: currentState() });
    });
  }

  function remove(view: SavedView) {
    startTransition(async () => {
      const result = await deleteView(view.id);
      if (result.ok) {
        toast.success(`View “${view.name}” deleted`);
        onApply(null);
      } else toast.error(result.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <BookmarkIcon />
            <span className="max-w-32 truncate">{active ? active.name : "Views"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          {views.length === 0 ? (
            <p className="px-2 pb-2 text-small text-muted-foreground">
              Save filters, sorting and columns to come back to them.
            </p>
          ) : (
            views.map((view) => (
              <DropdownMenuItem key={view.id} onSelect={() => onApply(view)}>
                <span className="flex-1 truncate">{view.name}</span>
                {view.id === activeViewId && <CheckIcon className="text-accent-ink" />}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setName(active?.name ?? "");
              setError(null);
              setDialogOpen(true);
            }}
          >
            Save current view…
          </DropdownMenuItem>
          {active && (
            <DropdownMenuItem
              variant="destructive"
              disabled={pending}
              onSelect={() => remove(active)}
            >
              <Trash2Icon /> Delete “{active.name}”
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Save view</DialogTitle>
              <DialogDescription>
                Keeps the current search, filters, sorting and columns. Only you can see it. Using
                an existing name replaces that view.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label htmlFor="view-name" className="text-small font-medium">
                Name
              </label>
              <Input
                id="view-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Banks only"
                aria-invalid={error ? true : undefined}
                aria-describedby="view-name-error"
              />
              {error && (
                <p id="view-name-error" className="text-small text-danger">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Save view
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
