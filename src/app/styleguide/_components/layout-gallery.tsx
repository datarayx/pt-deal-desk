import { DownloadIcon, PlusIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { kycStatus } from "@/lib/status";

export function LayoutGallery() {
  return (
    <div className="space-y-8 pt-4">
      <PageHeader
        title="Clients"
        description="Companies and individuals P&T is helping to raise funds."
        actions={
          <Button>
            <PlusIcon /> New client
          </Button>
        }
        menu={
          <>
            <DropdownMenuItem>
              <DownloadIcon /> Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DownloadIcon /> Export to PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Manage KYC checklists</DropdownMenuItem>
          </>
        }
      />

      <PageHeader
        eyebrow="Clients / Company"
        title="Zuma Rock Minerals Ltd"
        meta={<StatusBadge status={kycStatus.verified} />}
        description="RC 1458820 · Mining · Nasarawa"
        actions={<Button variant="outline">Edit details</Button>}
      />

      <EmptyState
        icon={<UsersIcon />}
        title="No clients yet"
        description="Add your first client to start tracking KYC and deals."
        action={
          <Button>
            <PlusIcon /> New client
          </Button>
        }
      />
    </div>
  );
}
