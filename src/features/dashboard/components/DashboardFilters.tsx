// Dashboard Filters - Date range selection

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Calendar, ChevronDown } from 'lucide-react';
import type { DateRangePreset } from '../types';

const DATE_PRESETS: SelectOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'previousMonth', label: 'Previous month' },
];

interface DashboardFiltersProps {
  selectedPreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  isLoading: boolean;
}

export function DashboardFilters({
  selectedPreset,
  customStartDate,
  customEndDate,
  onPresetChange,
  onCustomDateChange,
  isLoading,
}: DashboardFiltersProps) {
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPresetChange(preset);
    }
  };

  const presetOptions: SelectOption[] = [
    ...DATE_PRESETS,
    { value: 'custom', label: 'Custom range' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="date-preset" className="text-sm font-medium text-foreground">
              Period:
            </label>
            <Select
              id="date-preset"
              value={showCustom ? 'custom' : selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
              options={presetOptions}
              disabled={isLoading}
            />
          </div>

          {showCustom && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label htmlFor="start-date" className="text-sm font-medium text-muted-foreground">
                  From
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                    className="pl-10 w-40"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="end-date" className="text-sm font-medium text-muted-foreground">
                  To
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                    className="pl-10 w-40"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustom(false);
                  onPresetChange('last7days');
                }}
                disabled={isLoading}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}