// Review moderation service - management endpoints (backend enforces
// reviews.view / reviews.approve / reviews.reject / reviews.reply /
// reviews.delete per route).
//
// The response envelope is `{ success, message, data }` and each endpoint's
// `data` IS the resource (or a `{ items, pagination }` page) - it is NOT wrapped
// in `{ review: ... }`.

import { apiClient } from "@/lib/api";
import type {
  ModerateReviewInput,
  ReplyInput,
  ReviewListQuery,
  ReviewListResponse,
  ReviewRecord,
  ReviewReply,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class ReviewAdminService {
  private readonly basePath = "/management/reviews";

  async listReviews(query: ReviewListQuery = {}): Promise<ReviewListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: query.page,
      limit: query.limit,
      status: query.status,
      rating: query.rating,
      productId: query.productId?.trim() || undefined,
      customerId: query.customerId?.trim() || undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<ReviewListResponse>>(this.basePath, {
      params,
    });
    return response.data;
  }

  async getReview(id: string): Promise<ReviewRecord> {
    const response = await apiClient.get<ApiEnvelope<ReviewRecord>>(`${this.basePath}/${id}`);
    return response.data;
  }

  /** Approve or reject a PENDING review. The backend re-checks the permission. */
  async moderateReview(id: string, input: ModerateReviewInput): Promise<ReviewRecord> {
    const response = await apiClient.patch<ApiEnvelope<ReviewRecord>>(
      `${this.basePath}/${id}/moderate`,
      input
    );
    return response.data;
  }

  /** Permanently delete a review. Requires `reviews.delete`. */
  async deleteReview(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.basePath}/${id}`);
  }

  async addReply(id: string, input: ReplyInput): Promise<ReviewReply> {
    const response = await apiClient.post<ApiEnvelope<ReviewReply>>(
      `${this.basePath}/${id}/replies`,
      input
    );
    return response.data;
  }

  async updateReply(id: string, replyId: string, input: ReplyInput): Promise<ReviewReply> {
    const response = await apiClient.patch<ApiEnvelope<ReviewReply>>(
      `${this.basePath}/${id}/replies/${replyId}`,
      input
    );
    return response.data;
  }

  async deleteReply(id: string, replyId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.basePath}/${id}/replies/${replyId}`);
  }
}

export const reviewAdminService = new ReviewAdminService();
export { ReviewAdminService };
