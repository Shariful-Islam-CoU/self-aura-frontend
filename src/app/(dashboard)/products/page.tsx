"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  ProductTable,
  ProductTableSkeleton,
  ProductFilters,
  ProductDialog,
  ProductDetails,
  ProductDeleteDialog,
} from "@/features/products/components";
import type { ProductStatusFilter } from "@/features/products/components";
import { productService } from "@/features/products/services/productService";
import { categoryService } from "@/features/categories/services/categoryService";
import type { Category } from "@/features/categories/types";
import type {
  CreateProductInput,
  Product,
  ProductPagination,
  ProductSortBy,
  ProductSortOrder,
} from "@/features/products/types";
import { Package, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

type DialogMode = "create" | "edit";

export default function ProductsPage() {
  const { canAccess } = useAuth();
  const canManage = canAccess("products.create") || canAccess("products.edit") || canAccess("products.delete");

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ProductSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
  }, []);

  // Debounce product search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load categories for the filter and product form
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await categoryService.listCategories();
        if (!cancelled) setCategories(data);
      } catch {
        // Category filter is optional - keep an empty list
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load products whenever any query parameter changes
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await productService.listProducts({
          page,
          limit: pageSize,
          search: search || undefined,
          category: categoryFilter || undefined,
          isActive:
            statusFilter === "all" ? undefined : statusFilter === "true",
          sortBy,
          sortOrder,
        });
        if (!cancelled) {
          setProducts(data.items);
          setPagination(data.pagination);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load products."
          );
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [search, categoryFilter, statusFilter, sortBy, sortOrder, page, pageSize, refreshKey]);

  const hasActiveFilters =
    searchInput.trim() !== "" || categoryFilter !== "" || statusFilter !== "all";

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: ProductStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleSortChange = (column: ProductSortBy) => {
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

  const openCreate = () => {
    setSuccessMessage(null);
    setEditingProduct(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setSuccessMessage(null);
    setEditingProduct(product);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const openView = (product: Product) => {
    setProductToView(product);
    setDetailsOpen(true);
  };

  const openDelete = (product: Product) => {
    setSuccessMessage(null);
    setProductToDelete(product);
    setDeleteOpen(true);
  };

  const reloadProducts = () => setRefreshKey((key) => key + 1);

  /**
   * Saves the product record and returns the saved product, so the dialog can
   * move on to managing images for a product that did not exist a moment ago.
   * Errors are re-thrown for the form to render; this function must not
   * swallow them.
   */
  const handleSubmit = async (values: CreateProductInput): Promise<Product> => {
    setIsSubmitting(true);
    try {
      const saved =
        dialogMode === "edit" && editingProduct
          ? await productService.updateProduct(editingProduct.id, values)
          : await productService.createProduct(values);
      showSuccess(
        dialogMode === "edit"
          ? "Product updated successfully."
          : "Product created successfully."
      );
      reloadProducts();
      return saved;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * The canonical image list is already on each product row, so a save only has
   * to re-fetch the current page - no per-image API calls and no second source
   * of truth for the thumbnail.
   */
  const handleImagesChange = () => {
    reloadProducts();
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      showSuccess(
        productToDelete.isActive
          ? "Product deactivated successfully."
          : "Product reactivated successfully."
      );
      reloadProducts();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Self Aura products.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add product
          </Button>
        )}
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

      <ProductFilters
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

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <ProductTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load products."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your search filters."
                  : "Add your first product to start selling."
              }
              icon={<Package className="h-12 w-12" aria-hidden="true" />}
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                ) : canManage ? (
                  <Button onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    Add product
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              <ProductTable
                products={products}
                canManage={canManage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onView={openView}
                onEdit={openEdit}
                onDelete={openDelete}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                pageSizeOptions={[10, 20, 50]}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        mode={dialogMode}
        product={editingProduct}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
        onImagesChange={handleImagesChange}
      />

      <ProductDetails
        open={detailsOpen}
        product={productToView}
        onOpenChange={setDetailsOpen}
      />

      <ProductDeleteDialog
        open={deleteOpen}
        product={productToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}