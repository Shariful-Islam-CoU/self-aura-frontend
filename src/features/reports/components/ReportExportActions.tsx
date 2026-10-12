"use client";

// Export actions. The backend does NOT provide any downloadable report
// endpoint (no CSV / Excel / PDF export API exists), so this is an honest
// disabled placeholder - the frontend does not invent a client-side financial
// export to replace it.

import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export interface ReportExportActionsProps {
  reportName: string;
  className?: string;
}

export function ReportExportActions({ reportName, className }: ReportExportActionsProps) {
  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        title="Export is not available - the backend does not provide a downloadable report endpoint."
        aria-disabled="true"
      >
        <Download className="mr-1 h-4 w-4" aria-hidden="true" />
        Export
      </Button>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Export is not available — the backend does not provide a report export endpoint for{" "}
        {reportName}.
      </p>
    </div>
  );
}