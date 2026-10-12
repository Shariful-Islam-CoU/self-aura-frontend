"use client";

// Reusable report date-range selector. Presets are frontend conveniences that
// only generate dates - the backend remains responsible for the report
// calculation and date semantics.

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { CalendarDays } from "lucide-react";
import { REPORT_PRESETS } from "../constants";
import { buildReportDateRange } from "../utils";
import type { ReportDatePreset } from "../types";

export interface ReportDateRangeProps {
  preset: ReportDatePreset;
  startDate: string;
  endDate: string;
  onChange: (preset: ReportDatePreset, startDate: string, endDate: string) => void;
  disabled?: boolean;
}

export function ReportDateRange({
  preset,
  startDate,
  endDate,
  onChange,
  disabled,
}: ReportDateRangeProps) {
  const isCustom = preset === "custom";
  const resolved = !isCustom ? buildReportDateRange(preset) : { startDate, endDate };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-56">
        <Select
          id="report-period"
          label="Period"
          value={preset}
          disabled={disabled}
          options={[...REPORT_PRESETS]}
          onChange={(event) =>
            onChange(event.target.value as ReportDatePreset, startDate, endDate)
          }
        />
      </div>

      {isCustom ? (
        <>
          <div className="relative">
            <CalendarDays
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="date"
              id="report-start-date"
              aria-label="Start date"
              value={startDate}
              onChange={(event) => onChange("custom", event.target.value, endDate)}
              className="w-40 pl-9"
              disabled={disabled}
            />
          </div>
          <div className="relative">
            <CalendarDays
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="date"
              id="report-end-date"
              aria-label="End date"
              value={endDate}
              onChange={(event) => onChange("custom", startDate, event.target.value)}
              className="w-40 pl-9"
              disabled={disabled}
            />
          </div>
        </>
      ) : (
        <p className="pb-2.5 text-sm text-muted-foreground" aria-live="polite">
          {resolved.startDate && resolved.endDate
            ? `${resolved.startDate} to ${resolved.endDate}`
            : "No date restriction"}
        </p>
      )}
    </div>
  );
}