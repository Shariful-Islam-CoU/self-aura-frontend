import { describe, expect, it } from "vitest";
import {
  getPrimaryImage,
  moveItem,
  moveToFront,
  normalizeOrder,
  resolveMediaUrl,
  sameImageList,
} from "@/features/products/lib/media";
import type { ProductImage } from "@/features/products/types";

/**
 * Unit tests for the management app's product-image helpers.
 *
 * `resolveMediaUrl` is the one that matters most: uploads are stored as
 * root-relative `/media/<key>` URLs, and the management app runs on a different
 * origin from the API, so a URL passed through unconverted would 404 in every
 * thumbnail and preview.
 */

const API_ORIGIN = "http://localhost:5000";

describe("resolveMediaUrl", () => {
  it("resolves a root-relative media URL against the API origin", () => {
    expect(resolveMediaUrl("/media/abc-123.png")).toBe(
      `${API_ORIGIN}/media/abc-123.png`
    );
  });

  it("leaves an absolute URL untouched", () => {
    expect(resolveMediaUrl("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg"
    );
  });

  it("returns null for missing or empty values so callers show a fallback", () => {
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl("")).toBeNull();
  });

  it("refuses a non-http(s) scheme and a protocol-relative URL", () => {
    expect(resolveMediaUrl("javascript:alert(1)")).toBeNull();
    expect(resolveMediaUrl("//evil.example.com/a.jpg")).toBeNull();
  });
});

describe("getPrimaryImage", () => {
  const images: ProductImage[] = [
    { url: "https://x/1.jpg", alt: "one", sortOrder: 0 },
    { url: "https://x/2.jpg", alt: "two", sortOrder: 1 },
  ];

  it("returns the entry with the lowest sortOrder", () => {
    expect(getPrimaryImage(images)?.url).toBe("https://x/1.jpg");
  });

  it("returns undefined for an empty list", () => {
    expect(getPrimaryImage([])).toBeUndefined();
    expect(getPrimaryImage(undefined)).toBeUndefined();
  });
});

describe("normalizeOrder", () => {
  it("sorts and re-numbers densely from 0", () => {
    const result = normalizeOrder([
      { url: "https://x/c.jpg", alt: "c", sortOrder: 9 },
      { url: "https://x/a.jpg", alt: "a", sortOrder: 0 },
      { url: "https://x/b.jpg", alt: "b", sortOrder: 4 },
    ]);
    expect(result.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
    expect(result[0].url).toBe("https://x/a.jpg");
  });

  it("does not mutate the input", () => {
    const input: ProductImage[] = [
      { url: "https://x/b.jpg", alt: "b", sortOrder: 1 },
      { url: "https://x/a.jpg", alt: "a", sortOrder: 0 },
    ];
    normalizeOrder(input);
    expect(input[0].url).toBe("https://x/b.jpg");
  });
});

describe("moveItem / moveToFront", () => {
  const items = ["a", "b", "c", "d"];

  it("moves an item up and returns a new array", () => {
    expect(moveItem(items, 2, 1)).toEqual(["a", "c", "b", "d"]);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });

  it("moves an item to the front (which is what Make primary does)", () => {
    expect(moveToFront(items, 3)).toEqual(["d", "a", "b", "c"]);
  });

  it("is a no-op for an out-of-range index or an unchanged index", () => {
    expect(moveItem(items, 0, 0)).toBe(items);
    expect(moveItem(items, 9, 0)).toBe(items);
    expect(moveItem(items, 0, -1)).toBe(items);
  });
});

describe("sameImageList", () => {
  const base: ProductImage[] = [
    { url: "https://x/1.jpg", alt: "one", sortOrder: 0 },
    { url: "https://x/2.jpg", alt: "two", sortOrder: 1 },
  ];

  it("is true for an identical list", () => {
    expect(sameImageList(base, [...base])).toBe(true);
  });

  it("is false when the length changes (e.g. an image was removed)", () => {
    expect(sameImageList(base, base.slice(0, 1))).toBe(false);
  });

  it("is false when alt text was edited", () => {
    expect(
      sameImageList(base, [base[0], { ...base[1], alt: "changed" }])
    ).toBe(false);
  });

  it("is false when the order changes (images were reordered)", () => {
    expect(sameImageList(base, [base[1], base[0]])).toBe(false);
  });
});
