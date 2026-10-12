// Expense service - all expense-related API calls live here.
// Endpoints (all require authentication):
//   GET    /expenses         - paginated list (search / category / payment
//                              method / date range / sort)
//   POST   /expenses         - create (owner/manager)
//   GET    /expenses/:id     - single expense
//   PATCH  /expenses/:id     - update (owner/manager)
//   DELETE /expenses/:id     - delete (soft delete, owner/manager)
//   GET    /expenses/summary - totals by filters (owner/manager)

import { apiClient } from "@/lib/api";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseListData,
  ExpenseListParams,
  ExpenseSummaryData,
  ExpenseSummaryParams,
  UpdateExpenseInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class ExpenseService {
  private readonly basePath = "/expenses";

  async listExpenses(params: ExpenseListParams = {}): Promise<ExpenseListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      category: params.category || undefined,
      paymentMethod: params.paymentMethod || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      sortBy: params.sortBy ?? "expenseDate",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<ExpenseListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async getExpense(id: string): Promise<Expense> {
    const response = await apiClient.get<ApiEnvelope<{ expense: Expense }>>(
      `${this.basePath}/${id}`
    );
    return response.data.expense;
  }

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const response = await apiClient.post<ApiEnvelope<{ expense: Expense }>>(
      this.basePath,
      input
    );
    return response.data.expense;
  }

  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const response = await apiClient.patch<ApiEnvelope<{ expense: Expense }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.expense;
  }

  /** Soft-deletes the expense (hidden from all future lists). */
  async deleteExpense(id: string): Promise<Expense> {
    const response = await apiClient.delete<ApiEnvelope<{ expense: Expense }>>(
      `${this.basePath}/${id}`
    );
    return response.data.expense;
  }

  /** Backend-computed totals for the given filters (owner/manager). */
  async getExpenseSummary(
    params: ExpenseSummaryParams = {}
  ): Promise<ExpenseSummaryData> {
    const query: Record<string, string | undefined> = {
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      category: params.category || undefined,
      paymentMethod: params.paymentMethod || undefined,
    };
    const response = await apiClient.get<ApiEnvelope<ExpenseSummaryData>>(
      `${this.basePath}/summary`,
      { params: query }
    );
    return response.data;
  }
}

export const expenseService = new ExpenseService();
export { ExpenseService };