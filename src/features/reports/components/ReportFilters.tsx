"use client";

// Reusable report filter bar. Each report panel composes its own supported
// filters (date range + report-specific selects) as children and commits them
// only when the user presses Apply - avoiding uncontrolled duplicate requests.

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Filter, RotateCcw } from "lucide-react";

export interface ReportFiltersProps {
  loading: boolean;
  onApply: () => void;
  onReset: () => void;
  /** Optional validation message (e.g. invalid date range) shown above Apply. */
  error?: string | null;
  children?: ReactNode;
}

export function ReportFilters({ loading, onApply, onReset, error, children }: ReportFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {children}

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={onApply} disabled={loading || !!error}>
              <Filter className="mr-1 h-4 w-4" aria-hidden="true" />
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onReset}
              disabled={loading}
            >
              <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}