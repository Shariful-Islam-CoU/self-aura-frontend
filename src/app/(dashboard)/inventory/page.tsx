"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  InventoryFilters,
  InventoryTable,
  InventoryTableSkeleton,
  InventoryDetails,
  StockAdjustmentDialog,
} from "@/features/inventory/components";
import type { InventoryAction } from "@/features/inventory/components";
import type { StockAdjustmentMode } from "@/features/inventory/components";
import { inventoryService } from "@/features/inventory/services/inventoryService";
import { categoryService } from "@/features/categories/services/categoryService";
import type { Category } from "@/features/categories/types";
import type { Product, ProductPagination } from "@/features/products/types";
import type {
  AddStockInput,
  AdjustStockInput,
  InventoryListStatusFilter,
  InventoryTotals,
  RemoveStockInput,
} from "@/features/inventory/types";
import { formatCurrency, formatNumber } from "@/lib/currency";
import {
  Package,
  Layers,
  AlertTriangle,
  PackageX,
  Wallet,
  Info,
  X,
} from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconColor: string;
  isLoading?: boolean;
}

function SummaryCard({ title, value, icon, iconColor, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${iconColor} bg-primary/10`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <span className="mt-1 inline-block h-7 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-0.5 truncate text-xl font-bold text-foreground">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventoryPage() {
  const { canAccess } = useAuth();
  const canManage = canAccess("inventory.adjust");

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totals, setTotals] = useState<InventoryTotals | null>(null);
  const [totalsLoading, setTotalsLoading] = useState(true);
  const [totalsError, setTotalsError] = useState<string | null>(null);
  const [totalsRefreshKey, setTotalsRefreshKey] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryListStatusFilter>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "sellingPrice" | "stock">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [movementRefreshKey, setMovementRefreshKey] = useState(0);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustMode, setAdjustMode] = useState<StockAdjustmentMode>("add");
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLowStockMode = statusFilter === "low_stock";
  const hasActiveFilters =
    searchInput.trim() !== "" || categoryFilter !== "" || statusFilter !== "all";

  // Debounce product search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load categories for the filter dropdown
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await categoryService.listCategories();
        if (!cancelled) setCategories(data);
      } catch {
        // Category filter is optional - keep the list empty
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the inventory list (backend GET /products or GET /inventory/low-stock)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (isLowStockMode) {
          const data = await inventoryService.listLowStock();
          if (!cancelled) {
            setProducts(data);
            setPagination({
              page: 1,
              limit: Math.max(data.length, 1),
              total: data.length,
              totalPages: data.length > 0 ? 1 : 0,
            });
            setError(null);
            setIsLoading(false);
          }
        } else {
          const data = await inventoryService.listInventory({
            page,
            limit: pageSize,
            search: search || undefined,
            category: categoryFilter || undefined,
            isActive:
              statusFilter === "all" ? undefined : statusFilter === "active",
            sortBy,
            sortOrder,
          });
          if (!cancelled) {
            setProducts(data.items);
            setPagination(data.pagination);
            setError(null);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load inventory.");
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [isLowStockMode, search, categoryFilter, statusFilter, sortBy, sortOrder, page, pageSize, refreshKey]);

  // Load backend-computed inventory summary (GET /reports/inventory)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await inventoryService.getInventoryTotals(
          categoryFilter || undefined
        );
        if (!cancelled) {
          setTotals(data);
          setTotalsError(null);
          setTotalsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setTotalsError(
            err instanceof Error ? err.message : "Unable to load inventory summary."
          );
          setTotalsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [categoryFilter, totalsRefreshKey]);

  const handleSearchChange = (value: string) => {
    if (isLowStockMode) setStatusFilter("all");
    setSearchInput(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    if (isLowStockMode) setStatusFilter("all");
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: InventoryListStatusFilter) => {
    setStatusFilter(value);
    if (value === "low_stock") {
      setSearchInput("");
      setSearch("");
      setCategoryFilter("");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleSortChange = (column: "createdAt" | "name" | "sellingPrice" | "stock") => {
    setSortBy(column);
    setSortOrder((prev) => (sortBy === column && prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSuccessMessage(null);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  const openView = (product: Product) => {
    setProductToView(product);
    setMovementRefreshKey((key) => key + 1);
    setDetailsOpen(true);
  };

  const openAdjust = (product: Product, mode: StockAdjustmentMode) => {
    setDetailsOpen(false);
    setProductToAdjust(product);
    setAdjustMode(mode);
    setSuccessMessage(null);
    setAdjustOpen(true);
  };

  const handleTableAction = (product: Product, action: InventoryAction) => {
    if (action === "view") {
      openView(product);
    } else {
      openAdjust(product, action);
    }
  };

  const handleAdjustSubmit = async (
    values: AddStockInput | RemoveStockInput | AdjustStockInput
  ) => {
    if (!productToAdjust) return;
    setIsSubmitting(true);
    try {
      if (adjustMode === "add") {
        await inventoryService.addStock(productToAdjust.id, values as AddStockInput);
        setSuccessMessage("Stock added successfully.");
      } else if (adjustMode === "remove") {
        await inventoryService.removeStock(productToAdjust.id, values as RemoveStockInput);
        setSuccessMessage("Stock removed successfully.");
      } else {
        await inventoryService.adjustStock(productToAdjust.id, values as AdjustStockInput);
        setSuccessMessage("Stock adjusted successfully.");
      }
      // Refetch the backend data - stock is always the backend's source of truth.
      setRefreshKey((key) => key + 1);
      setTotalsRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Stock levels, movements, and adjustments.
          </p>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success-foreground"
        >
          <span>{successMessage}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {totalsLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <SummaryCard
              key={index}
              title="Loading..."
              value={null}
              icon={<Package className="h-5 w-5" aria-hidden="true" />}
              iconColor="text-primary"
              isLoading
            />
          ))
        ) : totalsError ? (
          <Card className="lg:col-span-5">
            <CardContent className="pt-6">
              <ErrorState
                title="Unable to load inventory summary."
                description={totalsError}
                onRetry={() => setTotalsRefreshKey((key) => key + 1)}
                retryLabel="Try again"
              />
            </CardContent>
          </Card>
        ) : totals ? (
          <>
            <SummaryCard
              title="Total products"
              value={formatNumber(totals.totalProducts)}
              icon={<Package className="h-5 w-5" aria-hidden="true" />}
              iconColor="text-primary"
            />
            <SummaryCard
              title="Total units in stock"
              value={formatNumber(totals.totalStockUnits)}
              icon={<Layers className="h-5 w-5" aria-hidden="true" />}
              iconColor="text-info"
            />
            <SummaryCard
              title="Low stock products"
              value={formatNumber(totals.lowStockCount)}
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              iconColor="text-warning"
            />
            <SummaryCard
              title="Out of stock products"
              value={formatNumber(totals.outOfStockCount)}
              icon={<PackageX className="h-5 w-5" aria-hidden="true" />}
              iconColor="text-destructive"
            />
            <SummaryCard
              title="Inventory value (cost)"
              value={formatCurrency(totals.costValue)}
              icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
              iconColor="text-success"
            />
          </>
        ) : null}
      </div>

      <InventoryFilters
        search={searchInput}
        categories={categories}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
      />

      {isLowStockMode && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <span>
            Showing active products at or below their low-stock threshold. Using
            search or a category filter switches to the full inventory view.
          </span>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <InventoryTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load inventory."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : products.length === 0 ? (
            isLowStockMode ? (
              <EmptyState
                title="No low stock products."
                description="No active products are at or below their low-stock threshold."
                icon={<AlertTriangle className="h-12 w-12" aria-hidden="true" />}
                action={
                  <Button variant="outline" onClick={handleResetFilters}>
                    Show all products
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No products found."
                description={
                  hasActiveFilters
                    ? "Try adjusting or resetting your filters."
                    : "Add products to your catalog to manage their inventory here."
                }
                icon={<Package className="h-12 w-12" aria-hidden="true" />}
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={handleResetFilters}>
                      Reset filters
                    </Button>
                  ) : undefined
                }
              />
            )
          ) : (
            <div className="space-y-4">
              <InventoryTable
                products={products}
                canManage={canManage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                sortingEnabled={!isLowStockMode}
                onSortChange={handleSortChange}
                onAction={handleTableAction}
              />
              {!isLowStockMode ? (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  pageSizeOptions={[10, 20, 50]}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Showing {products.length}{" "}
                  {products.length === 1 ? "product" : "products"} at or below their
                  low-stock threshold.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <InventoryDetails
        open={detailsOpen}
        product={productToView}
        canManage={canManage}
        movementRefreshKey={movementRefreshKey}
        onAdjust={(product) => openAdjust(product, "adjust")}
        onOpenChange={setDetailsOpen}
      />

      <StockAdjustmentDialog
        open={adjustOpen}
        mode={adjustMode}
        product={productToAdjust}
        isSubmitting={isSubmitting}
        onSubmit={handleAdjustSubmit}
        onOpenChange={setAdjustOpen}
      />
    </div>
  );
}