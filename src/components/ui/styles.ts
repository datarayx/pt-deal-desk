// Shared class strings for the restyled shadcn components, so related controls stay identical.
// Plain module (no "use client") so both Server and Client Components can import it.

/** Text field chrome — Input, SelectTrigger (and later Textarea, date picker trigger). */
export const fieldClassName = [
  "h-8 w-full min-w-0 rounded-lg border border-input bg-surface px-2.5 text-body text-foreground shadow-xs",
  "transition-[border-color,box-shadow] duration-100 outline-none",
  "placeholder:text-muted-foreground",
  "hover:border-border-strong",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted-foreground disabled:shadow-none",
  "aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/15",
].join(" ");

/** Floating panel chrome — SelectContent, DropdownMenuContent (and later Popover, Command). */
export const popoverClassName = [
  "rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
  "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98]",
  "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98]",
  "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1",
  "data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
].join(" ");

/** Menu row chrome — SelectItem, DropdownMenuItem (and later Command items). */
export const menuItemClassName = [
  "relative flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-body outline-hidden select-none",
  "focus:bg-surface-subtle focus:text-foreground",
  "data-disabled:pointer-events-none data-disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
].join(" ");
