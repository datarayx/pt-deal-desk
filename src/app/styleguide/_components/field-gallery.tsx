import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FieldGallery({ idPrefix }: { idPrefix: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-4 pt-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={id("company")} required>
          Registered name
        </Label>
        <Input id={id("company")} placeholder="e.g. Zuma Rock Minerals Ltd" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("phone")} required>
          Phone
        </Label>
        <Input id={id("phone")} defaultValue="+234 803 555 0142" className="num" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("facility")}>Facility type</Label>
        <Select defaultValue="lpo">
          <SelectTrigger id={id("facility")} className="w-full">
            <SelectValue placeholder="Choose a facility" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Facility types</SelectLabel>
              <SelectItem value="lpo">LPO financing</SelectItem>
              <SelectItem value="asset">Asset financing</SelectItem>
              <SelectItem value="wc">Working capital</SelectItem>
              <SelectItem value="project">Project finance</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("rate")}>Interest rate (per month)</Label>
        <div className="relative">
          <Input id={id("rate")} type="number" defaultValue="5.25" step="0.01" className="pr-8" />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-small text-muted-foreground">
            %
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("bvn")} required>
          BVN
        </Label>
        <Input
          id={id("bvn")}
          defaultValue="2234567"
          aria-invalid
          aria-describedby={id("bvn-error")}
        />
        <p id={id("bvn-error")} className="text-small text-danger">
          BVN must be 11 digits.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={id("search")}>Search</Label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={id("search")} placeholder="Search clients, deals…" className="pl-8" />
        </div>
        <Input disabled placeholder="Disabled field" />
      </div>
    </div>
  );
}
