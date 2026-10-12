"use client";

// Reports overview page.
//
// A single overview page with tabs (one per backend report endpoint). Each
// tab lazily mounts its report panel, so only the active report fetches data.
// Role handling: reports open to any authenticated staff (sales, inventory,
// customers, delivery) are always shown; owner/manager-only reports are hidden
// for staff. The backend remains the source of truth - a 403 (should one ever
// occur) is rendered as a permission error by each panel, never a logout.

import type { ComponentType } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { PageContainer } from "@/components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { SalesReport } from "@/features/reports/components/SalesReport";
import { PurchasesReport } from "@/features/reports/components/PurchasesReport";
import { ExpensesReport } from "@/features/reports/components/ExpensesReport";
import { PaymentsReport } from "@/features/reports/components/PaymentsReport";
import { ProfitLossReport } from "@/features/reports/components/ProfitLossReport";
import { InventoryReport } from "@/features/reports/components/InventoryReport";
import { CustomerReport } from "@/features/reports/components/CustomerReport";
import { ReturnsReport } from "@/features/reports/components/ReturnsReport";
import { DeliveryReport } from "@/features/reports/components/DeliveryReport";
import { ProductPerformanceReport } from "@/features/reports/components/ProductPerformanceReport";
import { CategoryPerformanceReport } from "@/features/reports/components/CategoryPerformanceReport";
import { DailySummaryReport } from "@/features/reports/components/DailySummaryReport";

interface ReportTab {
  id: string;
  label: string;
  permission: string;
  Component: ComponentType;
}

const REPORT_TABS: ReportTab[] = [
  { id: "sales", label: "Sales", permission: "reports.sales", Component: SalesReport },
  { id: "purchases", label: "Purchases", permission: "reports.purchases", Component: PurchasesReport },
  { id: "expenses", label: "Expenses", permission: "reports.expenses", Component: ExpensesReport },
  { id: "payments", label: "Payments", permission: "reports.payments", Component: PaymentsReport },
  { id: "profit-loss", label: "Profit & Loss", permission: "reports.profitLoss", Component: ProfitLossReport },
  { id: "inventory", label: "Inventory", permission: "reports.inventory", Component: InventoryReport },
  { id: "customers", label: "Customers", permission: "reports.customers", Component: CustomerReport },
  { id: "returns", label: "Returns", permission: "reports.returns", Component: ReturnsReport },
  { id: "delivery", label: "Delivery", permission: "reports.delivery", Component: DeliveryReport },
  {
    id: "products",
    label: "Product Performance",
    permission: "reports.products",
    Component: ProductPerformanceReport,
  },
  {
    id: "categories",
    label: "Category Performance",
    permission: "reports.categories",
    Component: CategoryPerformanceReport,
  },
  { id: "daily-summary", label: "Daily Summary", permission: "reports.dailySummary", Component: DailySummaryReport },
];

export default function ReportsPage() {
  const { canAccess } = useAuth();

  // Permission-driven tabs - each report maps to its backend permission key.
  // The backend is the source of truth; each panel still renders its own 403
  // state should a stale snapshot ever slip through.
  const tabs = REPORT_TABS.filter((tab) => canAccess(tab.permission));
  const defaultTab = tabs[0]?.id ?? "sales";

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Backend-computed business reports and analytics</p>
        </div>

        {tabs.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No reports are available for your account. Contact an Owner if you
            believe you should have report access.
          </div>
        ) : (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <tab.Component />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </PageContainer>
  );
}