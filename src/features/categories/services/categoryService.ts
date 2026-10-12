// Category service - handles all category-related API calls

import { apiClient } from "@/lib/api";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class CategoryService {
  private readonly basePath = "/categories";

  async listCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiEnvelope<Category[]>>(this.basePath);
    return response.data;
  }

  async getCategory(id: string): Promise<Category> {
    const response = await apiClient.get<ApiEnvelope<Category>>(
      `${this.basePath}/${id}`
    );
    return response.data;
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const response = await apiClient.post<ApiEnvelope<Category>>(
      this.basePath,
      input
    );
    return response.data;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const response = await apiClient.patch<ApiEnvelope<Category>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data;
  }

  /** Soft delete - backend deactivates the category (isActive = false). */
  async deleteCategory(id: string): Promise<Category> {
    const response = await apiClient.delete<ApiEnvelope<Category>>(
      `${this.basePath}/${id}`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Category thumbnail
  //
  // A category has AT MOST ONE thumbnail, so there is no list, no ordering and
  // no "add" route: the same endpoint uploads or replaces, and the other one
  // clears. Both are gated by the database-driven `categories.edit` permission,
  // the same permission the rest of the category form needs.
  // ---------------------------------------------------------------------------

  /**
   * Uploads or replaces the thumbnail and returns the whole updated category.
   *
   * The server uploads the new file BEFORE committing the new reference and only
   * then deletes the old asset, so a failure at any point leaves the category
   * pointing at a working image rather than at nothing.
   */
  async uploadCategoryThumbnail(
    id: string,
    file: File,
    alt?: string,
    onProgress?: (percent: number) => void
  ): Promise<Category> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const trimmedAlt = alt?.trim();
    if (trimmedAlt) formData.append("alt", trimmedAlt);

    const response = await apiClient.upload<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/thumbnail`,
      formData,
      onProgress ? { onProgress } : {}
    );
    return response.data.category;
  }

  /** Clears the thumbnail reference and deletes the stored asset. */
  async deleteCategoryThumbnail(id: string): Promise<Category> {
    const response = await apiClient.delete<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/thumbnail`
    );
    return response.data.category;
  }

  /**
   * Updates the description of the existing thumbnail, without re-uploading.
   *
   * This rides on the existing category update rather than adding a route: the
   * description is a field of the category document, and the dashboard is
   * already posting there. No bytes move, so it is a plain JSON PATCH - not a
   * multipart upload, and no progress bar is meaningful.
   */
  async updateCategoryThumbnailAlt(id: string, alt: string): Promise<Category> {
    const response = await apiClient.patch<ApiEnvelope<Category>>(`${this.basePath}/${id}`, {
      thumbnailAlt: alt,
    });
    return response.data;
  }

  async uploadCategoryBanner(
    id: string,
    file: File,
    alt?: string,
    onProgress?: (percent: number) => void
  ): Promise<Category> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const trimmedAlt = alt?.trim();
    if (trimmedAlt) formData.append("alt", trimmedAlt);

    const response = await apiClient.upload<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/banner`,
      formData,
      onProgress ? { onProgress } : {}
    );
    return response.data.category;
  }

  async deleteCategoryBanner(id: string): Promise<Category> {
    const response = await apiClient.delete<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/banner`
    );
    return response.data.category;
  }

  async updateCategoryBannerAlt(id: string, alt: string): Promise<Category> {
    const response = await apiClient.patch<ApiEnvelope<Category>>(`${this.basePath}/${id}`, {
      bannerAlt: alt,
    });
    return response.data;
  }
}

export const categoryService = new CategoryService();
export { CategoryService };