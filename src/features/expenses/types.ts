// Expense types matching the backend API.
// Backend: routes/expense.routes.ts, validators/expenseValidators.ts,
// types/expense.ts. POST/PATCH/DELETE /expenses and GET /expenses/summary are
// owner/manager only; listing and viewing are available to all roles.
// Expense categories: routes/expenseCategory.routes.ts (mutations
// owner/manager only).

export const EXPENSE_PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "mobile_banking",
  "other",
] as const;

export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_banking: "Mobile banking",
  other: "Other",
};

export interface ExpenseCategoryRef {
  id: string;
  name?: string;
  isActive?: boolean;
}

export interface ExpenseCreatedByRef {
  id: string;
  username?: string;
  role?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategoryRef;
  title: string;
  description?: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  reference?: string;
  note?: string;
  createdBy: ExpenseCreatedByRef;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseListData {
  expenses: Expense[];
  pagination: ExpensePagination;
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  paymentMethod?: ExpensePaymentMethod;
  fromDate?: string;
  toDate?: string;
  sortBy?: "expenseDate" | "createdAt" | "amount" | "expenseNumber";
  sortOrder?: "asc" | "desc";
}

export type ExpenseSortBy = NonNullable<ExpenseListParams["sortBy"]>;
export type ExpenseSortOrder = NonNullable<ExpenseListParams["sortOrder"]>;

export interface CreateExpenseInput {
  category: string;
  title: string;
  description?: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  expenseDate: string;
  reference?: string;
  note?: string;
}

export interface UpdateExpenseInput {
  category?: string;
  title?: string;
  description?: string;
  amount?: number;
  paymentMethod?: ExpensePaymentMethod;
  expenseDate?: string;
  reference?: string;
  note?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseCategoryListData {
  categories: ExpenseCategory[];
  pagination: ExpenseCategoryPagination;
}

export interface ExpenseCategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}

export interface CreateExpenseCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  description?: string;
}

export interface ExpenseSummaryEntry {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

export interface ExpenseSummaryData {
  summary: {
    total: number;
    count: number;
  };
  byCategory: ExpenseSummaryEntry[];
}

export interface ExpenseSummaryParams {
  fromDate?: string;
  toDate?: string;
  category?: string;
  paymentMethod?: ExpensePaymentMethod;
}