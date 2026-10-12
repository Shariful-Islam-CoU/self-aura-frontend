// Expense category service - API calls for expense categories.
// Endpoints (all require authentication):
//   GET    /expense-categories     - paginated list (search / isActive / sort)
//   POST   /expense-categories     - create (owner/manager)
//   GET    /expense-categories/:id - single category
//   PATCH  /expense-categories/:id - update (owner/manager)
//   DELETE /expense-categories/:id - deactivate (owner/manager)

import { apiClient } from "@/lib/api";
import type {
  CreateExpenseCategoryInput,
  ExpenseCategory,
  ExpenseCategoryListData,
  ExpenseCategoryListParams,
  UpdateExpenseCategoryInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class ExpenseCategoryService {
  private readonly basePath = "/expense-categories";

  async listCategories(
    params: ExpenseCategoryListParams = {}
  ): Promise<ExpenseCategoryListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy ?? "name",
      sortOrder: params.sortOrder ?? "asc",
    };
    const response = await apiClient.get<ApiEnvelope<ExpenseCategoryListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async createCategory(input: CreateExpenseCategoryInput): Promise<ExpenseCategory> {
    const response = await apiClient.post<ApiEnvelope<{ category: ExpenseCategory }>>(
      this.basePath,
      input
    );
    return response.data.category;
  }

  async updateCategory(
    id: string,
    input: UpdateExpenseCategoryInput
  ): Promise<ExpenseCategory> {
    const response = await apiClient.patch<ApiEnvelope<{ category: ExpenseCategory }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.category;
  }

  /** Deactivates the category (expense creation then rejects it). */
  async deactivateCategory(id: string): Promise<ExpenseCategory> {
    const response = await apiClient.delete<ApiEnvelope<{ category: ExpenseCategory }>>(
      `${this.basePath}/${id}`
    );
    return response.data.category;
  }
}

export const expenseCategoryService = new ExpenseCategoryService();
export { ExpenseCategoryService };