// Product service - handles all product-related API calls

import { apiClient } from "@/lib/api";
import type {
  Product,
  ProductListData,
  ProductListParams,
  ProductImagesResult,
  ProductVideosResult,
  CreateProductInput,
  UpdateProductInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class ProductService {
  private readonly basePath = "/products";

  async listProducts(params: ProductListParams = {}): Promise<ProductListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      category: params.category || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<ProductListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<ApiEnvelope<Product>>(
      `${this.basePath}/${id}`
    );
    return response.data;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const response = await apiClient.post<ApiEnvelope<Product>>(
      this.basePath,
      input
    );
    return response.data;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const response = await apiClient.patch<ApiEnvelope<Product>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data;
  }

  /** Soft delete - backend deactivates the product (isActive = false). */
  async deleteProduct(id: string): Promise<Product> {
    const response = await apiClient.delete<ApiEnvelope<Product>>(
      `${this.basePath}/${id}`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Product media
  //
  // Images and videos are managed through dedicated endpoints rather than as a
  // field on the product payload, because an upload has to be validated against
  // the actual bytes (container, size, dimensions) and stored in Cloudinary
  // before it can be referenced. Every call is gated by the same
  // database-driven `products.edit` permission as the product write it belongs
  // to - there is no role check anywhere in this file.
  //
  // Uploads are `multipart/form-data`. A base64 body inside JSON would inflate a
  // 100 MB video by a third and force the whole file into memory before a single
  // byte could be checked, and it is the transport the backend explicitly does
  // not accept.
  // ---------------------------------------------------------------------------

  /** Current image list, in canonical order, with the management-only fields. */
  async listProductImages(id: string): Promise<ProductImagesResult> {
    const response = await apiClient.get<ApiEnvelope<ProductImagesResult>>(
      `${this.basePath}/${id}/images`
    );
    return response.data;
  }

  /** Current video list, in canonical order, with the management-only fields. */
  async listProductVideos(id: string): Promise<ProductVideosResult> {
    const response = await apiClient.get<ApiEnvelope<ProductVideosResult>>(
      `${this.basePath}/${id}/videos`
    );
    return response.data;
  }

  /**
   * Uploads one image file.
   *
   * The server sniffs the bytes rather than trusting the browser's `file.type`,
   * derives the stored name itself, and returns the whole re-ordered list so the
   * UI can adopt the server's canonical order instead of guessing at it.
   */
  async uploadProductImage(
    id: string,
    file: File,
    alt?: string,
    onProgress?: (percent: number) => void
  ): Promise<ProductImagesResult> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const trimmedAlt = alt?.trim();
    if (trimmedAlt) formData.append("alt", trimmedAlt);

    const response = await apiClient.upload<ApiEnvelope<ProductImagesResult>>(
      `${this.basePath}/${id}/images`,
      formData,
      onProgress ? { onProgress } : {}
    );
    return response.data;
  }

  /** Uploads one video file. Same contract as the image upload, separate route. */
  async uploadProductVideo(
    id: string,
    file: File,
    alt?: string,
    onProgress?: (percent: number) => void
  ): Promise<ProductVideosResult> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const trimmedAlt = alt?.trim();
    if (trimmedAlt) formData.append("alt", trimmedAlt);

    const response = await apiClient.upload<ApiEnvelope<ProductVideosResult>>(
      `${this.basePath}/${id}/videos`,
      formData,
      onProgress ? { onProgress } : {}
    );
    return response.data;
  }

  /**
   * Replaces the ordered image list in one atomic request.
   *
   * The submitted entries ARE the new list: order defines the display order and
   * position 0 is the primary image, alt text is edited inline, and any image
   * left out is removed. The server validates the complete list before writing,
   * so a rejected entry cannot leave a half-applied product.
   */
  async updateProductImages(
    id: string,
    images: { key: string; alt?: string }[]
  ): Promise<ProductImagesResult> {
    const response = await apiClient.put<ApiEnvelope<ProductImagesResult>>(
      `${this.basePath}/${id}/images/order`,
      { images }
    );
    return response.data;
  }

  /** Replaces the ordered video list in one atomic request. */
  async updateProductVideos(
    id: string,
    videos: { key: string; alt?: string }[]
  ): Promise<ProductVideosResult> {
    const response = await apiClient.put<ApiEnvelope<ProductVideosResult>>(
      `${this.basePath}/${id}/videos/order`,
      { videos }
    );
    return response.data;
  }

  /** Removes a single image by its stable key. */
  async deleteProductImage(id: string, key: string): Promise<ProductImagesResult> {
    const response = await apiClient.delete<ApiEnvelope<ProductImagesResult>>(
      `${this.basePath}/${id}/images/${encodeURIComponent(key)}`
    );
    return response.data;
  }

  /** Removes a single video by its stable key. */
  async deleteProductVideo(id: string, key: string): Promise<ProductVideosResult> {
    const response = await apiClient.delete<ApiEnvelope<ProductVideosResult>>(
      `${this.basePath}/${id}/videos/${encodeURIComponent(key)}`
    );
    return response.data;
  }
}

export const productService = new ProductService();
export { ProductService };