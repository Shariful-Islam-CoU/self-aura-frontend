"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/providers/AuthProvider";
import {
  ExpenseFilters,
  ExpenseSummary,
  ExpenseTable,
  ExpenseTableSkeleton,
  ExpenseDialog,
  ExpenseDetails,
  ExpenseDeleteDialog,
  ExpenseCategoryManager,
} from "@/features/expenses/components";
import type {
  ExpenseAction,
  ExpensePaymentMethodFilter,
} from "@/features/expenses/components";
import type { ExpenseFormValues } from "@/features/expenses/components/ExpenseForm";
import { expenseService } from "@/features/expenses/services/expenseService";
import { expenseCategoryService } from "@/features/expenses/services/expenseCategoryService";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpensePagination,
  ExpensePaymentMethod,
  ExpenseSortBy,
  ExpenseSortOrder,
  ExpenseSummaryData,
} from "@/features/expenses/types";
import { Wallet, Plus, X } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export default function ExpensesPage() {
  const { canAccess } = useAuth();
  // Expense mutations map to expenses.create/edit/delete; the summary panel
  // reads GET /expenses/summary (reports.expenses). Listing and viewing are
  // available to any role with expenses.view.
  const canViewStats = canAccess("reports.expenses");
  const canManage =
    canAccess("expenses.create") ||
    canAccess("expenses.edit") ||
    canAccess("expenses.delete");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<ExpensePagination>({
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
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<ExpensePaymentMethodFilter>("all");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [sortBy, setSortBy] = useState<ExpenseSortBy>("expenseDate");
  const [sortOrder, setSortOrder] = useState<ExpenseSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesRefreshKey, setCategoriesRefreshKey] = useState(0);

  const [summary, setSummary] = useState<ExpenseSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expenseToView, setExpenseToView] = useState<Expense | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    categoryFilter !== "" ||
    paymentMethodFilter !== "all" ||
    fromFilter !== "" ||
    toFilter !== "";

  // Debounce expense search (number / title / reference, server-side).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load the expense list (GET /expenses; server-authoritative pagination).
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await expenseService.listExpenses({
          page,
          limit: pageSize,
          search: search || undefined,
          category: categoryFilter || undefined,
          paymentMethod:
            paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
          fromDate: fromFilter || undefined,
          toDate: toFilter || undefined,
          sortBy,
          sortOrder,
        });
        if (!cancelled) {
          setExpenses(data.expenses);
          setPagination(data.pagination);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load expenses."
          );
          setIsLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [
    search,
    categoryFilter,
    paymentMethodFilter,
    fromFilter,
    toFilter,
    sortBy,
    sortOrder,
    page,
    pageSize,
    refreshKey,
  ]);

  // Load expense categories (used by the filter select, expense form picker
  // and the manage-categories dialog). Refetch when the manager opens or after
  // any category mutation.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await expenseCategoryService.listCategories({
          page: 1,
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (!cancelled) {
          setCategories(data.categories);
          setCategoriesError(null);
          setCategoriesLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setCategoriesError(
            err instanceof Error ? err.message : "Unable to load categories."
          );
          setCategoriesLoading(false);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [categoriesRefreshKey, categoryManagerOpen]);

  // Backend-computed totals for the current filters (reports.expenses).
  useEffect(() => {
    if (!canViewStats) return;
    let cancelled = false;
    const init = async () => {
      setSummaryLoading(true);
      try {
        const data = await expenseService.getExpenseSummary({
          category: categoryFilter || undefined,
          paymentMethod:
            paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
          fromDate: fromFilter || undefined,
          toDate: toFilter || undefined,
        });
        if (!cancelled) {
          setSummary(data);
          setSummaryError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryError(
            err instanceof Error
              ? err.message
              : "Unable to load expense summary."
          );
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [
    canViewStats,
    categoryFilter,
    paymentMethodFilter,
    fromFilter,
    toFilter,
    summaryRefreshKey,
  ]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handlePaymentMethodChange = (value: ExpensePaymentMethodFilter) => {
    setPaymentMethodFilter(value);
    setPage(1);
  };

  const handleFromChange = (value: string) => {
    setFromFilter(value);
    setPage(1);
  };

  const handleToChange = (value: string) => {
    setToFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setPaymentMethodFilter("all");
    setFromFilter("");
    setToFilter("");
    setPage(1);
  };

  const handleSortChange = (column: ExpenseSortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
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
    setExpenseToEdit(null);
    setDialogMode("create");
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const handleTableAction = (expense: Expense, action: ExpenseAction) => {
    if (action === "view") {
      setExpenseToView(expense);
      setDetailsOpen(true);
    } else if (action === "edit") {
      setExpenseToEdit(expense);
      setDialogMode("edit");
      setSuccessMessage(null);
      setDialogOpen(true);
    } else {
      setExpenseToDelete(expense);
      setSuccessMessage(null);
      setDeleteOpen(true);
    }
  };

  const handleCategoriesChanged = () => {
    setCategoriesRefreshKey((key) => key + 1);
  };

  // The expense dialog closes itself after this promise resolves; on failure
  // the form keeps the dialog open and surfaces the server error.
  const handleSubmit = async (
    values: ExpenseFormValues
  ): Promise<Expense> => {
    setIsSubmitting(true);
    try {
      const input: CreateExpenseInput = {
        category: values.category,
        title: values.title,
        description: values.description || undefined,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod as ExpensePaymentMethod,
        expenseDate: values.expenseDate,
        reference: values.reference || undefined,
        note: values.note || undefined,
      };
      if (dialogMode === "edit" && expenseToEdit) {
        const updated = await expenseService.updateExpense(
          expenseToEdit.id,
          input
        );
        setSuccessMessage(`Expense ${updated.expenseNumber} updated.`);
        setRefreshKey((key) => key + 1);
        setSummaryRefreshKey((key) => key + 1);
        return updated;
      }
      const created = await expenseService.createExpense(input);
      setSuccessMessage(`Expense ${created.expenseNumber} created.`);
      setPage(1);
      setRefreshKey((key) => key + 1);
      setSummaryRefreshKey((key) => key + 1);
      return created;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsSubmitting(true);
    try {
      const deleted = await expenseService.deleteExpense(expenseToDelete.id);
      setSuccessMessage(`Expense ${deleted.expenseNumber} deleted.`);
      setRefreshKey((key) => key + 1);
      setSummaryRefreshKey((key) => key + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only active categories can be assigned to new/updated expenses (the
  // backend rejects inactive ones); the filter select keeps showing inactive
  // ones so historical filters still work.
  const activeCategories = categories.filter((item) => item.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track operating costs and other business expenses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryManagerOpen(true)}
              >
                Manage categories
              </Button>
              <Button type="button" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Add expense
              </Button>
            </>
          )}
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

      <ExpenseFilters
        search={searchInput}
        category={categoryFilter}
        paymentMethod={paymentMethodFilter}
        from={fromFilter}
        to={toFilter}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onPaymentMethodChange={handlePaymentMethodChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onReset={handleResetFilters}
      />

      {canViewStats && (
        <ExpenseSummary
          summary={summary}
          isLoading={summaryLoading}
          error={summaryError}
          onRetry={() => setSummaryRefreshKey((key) => key + 1)}
        />
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <ExpenseTableSkeleton />
          ) : error ? (
            <ErrorState
              title="Unable to load expenses."
              description={error}
              onRetry={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              retryLabel="Try again"
            />
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expenses found."
              description={
                hasActiveFilters
                  ? "Try adjusting or resetting your filters."
                  : "Add expenses to start tracking your operating costs."
              }
              icon={<Wallet className="h-12 w-12" aria-hidden="true" />}
              action={
                canManage ? (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                    Add expense
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              <ExpenseTable
                expenses={expenses}
                canManage={canManage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onAction={handleTableAction}
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

      <ExpenseDialog
        open={dialogOpen}
        mode={dialogMode}
        expense={expenseToEdit}
        categories={activeCategories}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onOpenChange={setDialogOpen}
      />

      <ExpenseDetails
        open={detailsOpen}
        expense={expenseToView}
        onOpenChange={setDetailsOpen}
      />

      <ExpenseDeleteDialog
        open={deleteOpen}
        expense={expenseToDelete}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onOpenChange={setDeleteOpen}
      />

      <ExpenseCategoryManager
        open={categoryManagerOpen}
        categories={categories}
        isLoading={categoriesLoading}
        error={categoriesError}
        canManage={canManage}
        onRetry={() => setCategoriesRefreshKey((key) => key + 1)}
        onChanged={handleCategoriesChanged}
        onOpenChange={setCategoryManagerOpen}
      />
    </div>
  );
}