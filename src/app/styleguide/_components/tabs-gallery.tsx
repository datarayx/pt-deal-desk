import { KanbanSquareIcon, TableIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabsGallery() {
  return (
    <div className="space-y-6 pt-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements <Badge variant="warning">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="text-body text-muted-foreground">
          Line tabs for detail pages (Client 360, Deal detail).
        </TabsContent>
        <TabsContent value="requirements" className="text-body text-muted-foreground">
          3 required items still pending from the client.
        </TabsContent>
        <TabsContent value="repayments" className="text-body text-muted-foreground">
          12 instalments · 4 confirmed.
        </TabsContent>
        <TabsContent value="activity" className="text-body text-muted-foreground">
          Notes, calls and stage changes.
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="kanban">
        <TabsList variant="segmented">
          <TabsTrigger value="kanban">
            <KanbanSquareIcon /> Kanban
          </TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon /> Table
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="text-body text-muted-foreground">
          Segmented control for switching views.
        </TabsContent>
        <TabsContent value="table" className="text-body text-muted-foreground">
          Same data, table layout.
        </TabsContent>
      </Tabs>
    </div>
  );
}
