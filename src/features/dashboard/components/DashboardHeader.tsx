// Dashboard Header component

import { Separator } from '@/components/ui/Separator';
import { Button } from '@/components/ui/Button';
import { Calendar, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  dateRange: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({ dateRange, onRefresh, isRefreshing }: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your Self Aura business
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{dateRange}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
      <Separator />
    </div>
  );
}