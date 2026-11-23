"use client";

import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function OverlayDemos() {
  const [saving, setSaving] = useState(false);

  function fakeSave() {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      toast.success("Deal PT-2026-0042 created", {
        description: "Requirement checklist copied from Crestline Finance House.",
      });
    }, 900);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
      <Sheet>
        <SheetTrigger asChild>
          <Button>
            <PlusIcon /> New deal (sheet)
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New deal</SheetTitle>
            <SheetDescription>
              The financier&apos;s requirement list is copied in automatically.
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sg-client" required>
                Client
              </Label>
              <Input id="sg-client" defaultValue="Zuma Rock Minerals Ltd" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sg-financier" required>
                Financier
              </Label>
              <Select defaultValue="crestline">
                <SelectTrigger id="sg-financier" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crestline">Crestline Finance House</SelectItem>
                  <SelectItem value="harbourgate">Harbourgate Capital</SelectItem>
                  <SelectItem value="savanna">Savanna Credit Ltd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sg-amount" required>
                  Amount requested (₦)
                </Label>
                <Input id="sg-amount" className="num" defaultValue="45,000,000.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sg-tenor" required>
                  Tenor (months)
                </Label>
                <Input id="sg-tenor" type="number" defaultValue="6" />
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button pending={saving} onClick={fakeSave}>
              Create deal
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Trash2Icon /> Delete (dialog)
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete referrer &ldquo;Kunle Adebayo&rdquo;?</DialogTitle>
            <DialogDescription>
              This removes the referrer from the directory. Deals they referred keep their history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={() => toast("Referrer deleted")}>
                Delete referrer
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Row actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>PT-2026-0027</DropdownMenuLabel>
          <DropdownMenuItem>
            <PencilIcon /> Edit deal <DropdownMenuShortcut>E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PhoneIcon /> Log call
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CopyIcon /> Copy reference
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2Icon /> Decline deal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">Hover for tooltip</Button>
        </TooltipTrigger>
        <TooltipContent>Confirmed by financier on 18 Nov 2026</TooltipContent>
      </Tooltip>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => toast.success("Repayment confirmed")}>
          Success toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.warning("2 instalments overdue", {
              description: "Okeke Agro Processing Ltd · Harbourgate Capital",
            })
          }
        >
          Warning toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error("Journal not balanced", {
              description: "Debits ₦1,250,000.00 ≠ credits ₦1,200,000.00",
            })
          }
        >
          Error toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast("Deal moved to Submitted", {
              action: { label: "Undo", onClick: () => toast("Move undone") },
            })
          }
        >
          Toast with action
        </Button>
      </div>
    </div>
  );
}
