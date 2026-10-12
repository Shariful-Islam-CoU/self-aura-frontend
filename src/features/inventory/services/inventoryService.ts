// Inventory service - handles all inventory-related API calls.
// The backend routes are under /inventory (stock operations + history) and
// /reports/inventory (backend-computed inventory totals). The inventory list
// itself comes from the shared GET /products endpoint, so it reuses
// productService.listProducts to keep one source of envelope-unwrapping.

import { apiClient } from "@/lib/api";
import { productService } from "@/features/products/services/productService";
import type {
  Product,
  ProductListData,
  ProductListParams,
} from "@/features/products/types";
import type {
  AddStockInput,
  AdjustStockInput,
  InventoryTotals,
  RemoveStockInput,
  StockChangeResult,
  StockMovementListData,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class InventoryService {
  private readonly basePath = "/inventory";

  /** Paginated inventory list - reuse the backend GET /products listing. */
  async listInventory(params: ProductListParams = {}): Promise<ProductListData> {
    return productService.listProducts(params);
  }

  /**
   * Low-stock products (active products with stock <= lowStockThreshold).
   * Backend returns all matches without pagination.
   */
  async listLowStock(): Promise<Product[]> {
    const response = await apiClient.get<ApiEnvelope<{ items: Product[] }>>(
      `${this.basePath}/low-stock`
    );
    return response.data.items;
  }

  /** Backend-computed inventory totals from GET /reports/inventory. */
  async getInventoryTotals(categoryId?: string): Promise<InventoryTotals> {
    const response = await apiClient.get<
      ApiEnvelope<{ categoryId?: string; totals: InventoryTotals }>
    >("/reports/inventory", {
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data.totals;
  }

  /** Paginated stock movement history for a product. */
  async getStockHistory(
    productId: string,
    params?: { page?: number; limit?: number }
  ): Promise<StockMovementListData> {
    const response = await apiClient.get<ApiEnvelope<StockMovementListData>>(
      `${this.basePath}/${productId}/history`,
      { params }
    );
    return response.data;
  }

  /** Add stock (backend type: stock_in, reason: restock). */
  async addStock(productId: string, input: AddStockInput): Promise<StockChangeResult> {
    const response = await apiClient.post<ApiEnvelope<StockChangeResult>>(
      `${this.basePath}/${productId}/add`,
      input
    );
    return response.data;
  }

  /** Remove stock (backend type: stock_out). 409 when insufficient stock. */
  async removeStock(productId: string, input: RemoveStockInput): Promise<StockChangeResult> {
    const response = await apiClient.post<ApiEnvelope<StockChangeResult>>(
      `${this.basePath}/${productId}/remove`,
      input
    );
    return response.data;
  }

  /**
   * Set an absolute stock value (backend type: adjustment).
   * Rejects with 400 when newStock equals the current stock.
   */
  async adjustStock(productId: string, input: AdjustStockInput): Promise<StockChangeResult> {
    const response = await apiClient.post<ApiEnvelope<StockChangeResult>>(
      `${this.basePath}/${productId}/adjust`,
      input
    );
    return response.data;
  }
}

export const inventoryService = new InventoryService();
export { InventoryService };