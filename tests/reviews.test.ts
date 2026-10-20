import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Review moderation service contract tests.
 *
 * These lock the wire contract against the backend management router
 * (`routes/review.routes.ts`): the exact method/path per action, and the fact
 * that `data` IS the resource (it must not be re-wrapped). A regression here
 * (wrong prefix, reading `data.review`) is what previously made every review
 * write silently resolve to `undefined`.
 */

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    get: (path: string, options?: unknown) =>
      requestMock({ method: "GET", path, options }),
    post: (path: string, data?: unknown, options?: unknown) =>
      requestMock({ method: "POST", path, data, options }),
    patch: (path: string, data?: unknown, options?: unknown) =>
      requestMock({ method: "PATCH", path, data, options }),
    delete: (path: string, options?: unknown) =>
      requestMock({ method: "DELETE", path, options }),
  },
}));

import { reviewAdminService } from "@/features/reviews";

const review = {
  id: "r1",
  product: { id: "p1", name: "Silver Ring" },
  customer: { id: "c1", name: "Ayesha Khan" },
  order: { id: "o1" },
  orderItem: "oi1",
  rating: 5,
  comment: "Loved it",
  images: [],
  replies: [],
  status: "pending" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  requestMock.mockReset();
});

describe("reviewAdminService path contract", () => {
  it("lists under /management/reviews with filters as params", async () => {
    requestMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
    });

    const result = await reviewAdminService.listReviews({
      page: 2,
      limit: 10,
      status: "pending",
      rating: 5,
      sortBy: "recent",
    });

    const call = requestMock.mock.calls[0][0];
    expect(call.method).toBe("GET");
    expect(call.path).toBe("/management/reviews");
    expect(call.options.params).toMatchObject({
      page: 2,
      limit: 10,
      status: "pending",
      rating: 5,
      sortBy: "recent",
    });
    expect(result.items).toEqual([]);
  });

  it("reads a single review and unwraps data directly (no { review } wrapper)", async () => {
    requestMock.mockResolvedValue({ success: true, message: "ok", data: review });

    const result = await reviewAdminService.getReview("r1");

    expect(requestMock.mock.calls[0][0].path).toBe("/management/reviews/r1");
    expect(result.id).toBe("r1");
    expect(result.moderationNote).toBeUndefined();
  });

  it("moderates via PATCH /:id/moderate", async () => {
    requestMock.mockResolvedValue({ success: true, message: "ok", data: review });

    await reviewAdminService.moderateReview("r1", {
      status: "approved",
      moderationNote: "Looks genuine",
    });

    const call = requestMock.mock.calls[0][0];
    expect(call.method).toBe("PATCH");
    expect(call.path).toBe("/management/reviews/r1/moderate");
    expect(call.data).toEqual({ status: "approved", moderationNote: "Looks genuine" });
  });

  it("deletes via DELETE /:id", async () => {
    requestMock.mockResolvedValue({ success: true, message: "ok", data: null });

    await reviewAdminService.deleteReview("r1");

    const call = requestMock.mock.calls[0][0];
    expect(call.method).toBe("DELETE");
    expect(call.path).toBe("/management/reviews/r1");
  });

  it("adds a reply via POST /:id/replies and returns the reply", async () => {
    const reply = {
      id: "rep1",
      authorType: "admin" as const,
      authorName: "Self Aura Team",
      text: "Thank you!",
    };
    requestMock.mockResolvedValue({ success: true, message: "ok", data: reply });

    const result = await reviewAdminService.addReply("r1", { text: "Thank you!" });

    const call = requestMock.mock.calls[0][0];
    expect(call.method).toBe("POST");
    expect(call.path).toBe("/management/reviews/r1/replies");
    expect(call.data).toEqual({ text: "Thank you!" });
    expect(result.authorName).toBe("Self Aura Team");
  });

  it("updates a reply via PATCH /:id/replies/:replyId", async () => {
    requestMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { id: "rep1", authorType: "admin", authorName: "Self Aura Team", text: "Edited" },
    });

    await reviewAdminService.updateReply("r1", "rep1", { text: "Edited" });

    const call = requestMock.mock.calls[0][0];
    expect(call.method).toBe("PATCH");
    expect(call.path).toBe("/management/reviews/r1/replies/rep1");
  });

  it("deletes a reply via DELETE /:id/replies/:replyId", async () => {
    requestMock.mockResolvedValue({ success: true, message: "ok", data: null });

    await reviewAdminService.deleteReply("r1", "rep1");

    const call = requestMock.mock.calls[0][0];
    expect(call.method).toBe("DELETE");
    expect(call.path).toBe("/management/reviews/r1/replies/rep1");
  });
});
