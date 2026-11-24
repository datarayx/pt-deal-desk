"use client";

import { CheckIcon, PlusCircleIcon } from "lucide-react";

import type { FacetOption } from "@/components/data-table/column-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Toolbar filter: a popover of options with counts; several can be chosen. */
export function DataTableFacetFilter({
  title,
  options,
  counts,
  selected,
  onChange,
}: {
  title: string;
  options: FacetOption[];
  counts: Record<string, number>;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const chosen = new Set(selected);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircleIcon />
          {title}
          {chosen.size > 0 && (
            <>
              <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
              {chosen.size > 2 ? (
                <Badge variant="accent">{chosen.size} selected</Badge>
              ) : (
                options
                  .filter((o) => chosen.has(o.value))
                  .map((o) => (
                    <Badge key={o.value} variant="accent">
                      {o.label}
                    </Badge>
                  ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = chosen.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() =>
                      onChange(
                        isSelected
                          ? selected.filter((v) => v !== option.value)
                          : [...selected, option.value],
                      )
                    }
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border border-border-strong",
                        isSelected && "border-accent bg-accent text-accent-foreground",
                      )}
                      aria-hidden
                    >
                      {isSelected && <CheckIcon className="size-3" />}
                    </span>
                    <span className="flex-1 truncate">{option.label}</span>
                    <span className="num text-caption text-muted-foreground">
                      {counts[option.value] ?? 0}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {chosen.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])} className="justify-center">
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
