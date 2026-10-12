import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductImageManager } from "@/features/products/components/ProductImageManager";
import { mediaFakes } from "./setup";
import type { ManagedProductImage } from "@/features/products/types";

/**
 * Component tests for the management product image manager.
 *
 * These cover the behaviours the product requirements call for - add (upload),
 * remove, reorder, select primary, edit alt text and preview - plus the loading
 * and saving states, and the rule that a rejected save surfaces the server's
 * message while keeping the staged edit instead of silently losing it.
 *
 * `productService` is replaced in tests/setup.tsx, so every assertion here is
 * about the UI's own behaviour and the exact request it would make.
 */

const API_ORIGIN = "http://localhost:5000";

function image(key: string, sortOrder: number, alt: string): ManagedProductImage {
  return {
    key,
    url: `/media/${key}.png`,
    alt,
    sortOrder,
    mimeType: "image/png",
    managed: true,
  };
}

function renderManager() {
  return render(<ProductImageManager productId="p1" productName="Emerald Halo Ring" />);
}

/** The alt inputs, in the order the user sees them. */
const altInputs = () => screen.getAllByLabelText(/^Alt text for image \d+$/);

beforeEach(() => {
  mediaFakes.reset();
  mediaFakes.listResult = {
    images: [image("aaa", 0, "Front view"), image("bbb", 1, "Side view")],
  };
});

afterEach(() => {
  cleanup();
});

describe("ProductImageManager — loading", () => {
  it("loads the product's images for the bound product id", async () => {
    renderManager();
    expect(await screen.findByDisplayValue("Front view")).toBeTruthy();
    expect(mediaFakes.calls[0]).toEqual({ method: "list", payload: "p1" });
    expect(altInputs()).toHaveLength(2);
  });

  it("shows a busy skeleton instead of the list while the request is in flight", () => {
    mediaFakes.listResult = new Promise(() => {}) as never;
    renderManager();
    expect(screen.getByTestId("product-images-loading")).toBeTruthy();
    // The list must not be rendered yet - an empty list would read as
    // "this product has no images".
    expect(screen.queryByLabelText("Alt text for image 1")).toBeNull();
    expect(screen.getByText("0/10")).toBeTruthy();
  });

  it("surfaces a load failure instead of pretending the product has no images", async () => {
    mediaFakes.listError = new Error("Products: read failed");
    renderManager();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Products: read failed");
    // The product may well have images - we simply could not read them, so the
    // "no images yet" empty state must not be shown.
    expect(screen.queryByText(/No images yet/)).toBeNull();
  });

  it("tells the user when the product genuinely has no images", async () => {
    mediaFakes.listResult = { images: [] };
    renderManager();
    expect(await screen.findByText(/No images yet/)).toBeTruthy();
  });
});

describe("ProductImageManager — primary image", () => {
  it("marks the first image as primary and offers no promotion for it", async () => {
    renderManager();
    await screen.findByDisplayValue("Front view");
    expect(screen.getByText("Primary")).toBeTruthy();
    // Only the non-primary image offers "make primary".
    expect(screen.getAllByRole("button", { name: /^Make image \d+/ })).toHaveLength(1);
  });

  it("promotes an image by moving it to the front, staged until save", async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    // Nothing has been sent yet: the change is staged locally.
    expect(mediaFakes.calls.filter((call) => call.method === "update")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /^Make image 2/ }));

    expect(altInputs()[0]).toHaveProperty("value", "Side view");
    expect(screen.getByText(/unsaved/)).toBeTruthy();
    // Still no request: the user is in control of when the product changes.
    expect(mediaFakes.calls.filter((call) => call.method === "update")).toHaveLength(0);
  });

  it("sends the whole reordered list in one request on save", async () => {
    mediaFakes.updateResult = {
      images: [image("bbb", 0, "Side view"), image("aaa", 1, "Front view")],
    };
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    await user.click(screen.getByRole("button", { name: /^Make image 2/ }));
    await user.click(screen.getByRole("button", { name: "Save images" }));

    await waitFor(() => {
      const update = mediaFakes.calls.find((call) => call.method === "update");
      expect(update?.payload).toEqual({
        id: "p1",
        // The complete list in its new order: one atomic write, validated as a
        // whole by the server so a bad entry can never half-apply.
        images: [
          { key: "bbb", alt: "Side view" },
          { key: "aaa", alt: "Front view" },
        ],
      });
    });
    await waitFor(() => expect(screen.queryByText(/unsaved/)).toBeNull());
  });
});

describe("ProductImageManager — reorder, alt text and remove", () => {
  it("moves an image up and down within the list", async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    await user.click(screen.getByRole("button", { name: "Move image 2 up" }));
    expect(altInputs()[0]).toHaveProperty("value", "Side view");

    await user.click(screen.getByRole("button", { name: "Move image 1 down" }));
    expect(altInputs()[0]).toHaveProperty("value", "Front view");
  });

  it("disables moving the first image up and the last image down", async () => {
    renderManager();
    await screen.findByDisplayValue("Side view");
    expect(
      screen.getByRole("button", { name: "Move image 1 up" })
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Move image 2 down" })
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Move image 2 up" })
    ).toHaveProperty("disabled", false);
  });

  it("stages an alt-text edit and persists it on save", async () => {
    mediaFakes.updateResult = {
      images: [image("aaa", 0, "Gold band"), image("bbb", 1, "Side view")],
    };
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Front view");

    const altInput = screen.getByLabelText("Alt text for image 1");
    await user.clear(altInput);
    await user.type(altInput, "Gold band");
    expect(screen.getByText(/unsaved/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Save images" }));

    await waitFor(() => {
      const update = mediaFakes.calls.find((call) => call.method === "update");
      expect(update?.payload).toMatchObject({
        images: [
          { key: "aaa", alt: "Gold band" },
          { key: "bbb", alt: "Side view" },
        ],
      });
    });
  });

  it("omits a removed image from the saved list", async () => {
    mediaFakes.updateResult = { images: [image("aaa", 0, "Front view")] };
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    await user.click(screen.getByRole("button", { name: /^Remove image 2/ }));
    expect(screen.queryByLabelText("Alt text for image 2")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Save images" }));

    await waitFor(() => {
      const update = mediaFakes.calls.find((call) => call.method === "update");
      expect(update?.payload).toEqual({
        id: "p1",
        images: [{ key: "aaa", alt: "Front view" }],
      });
    });
  });

  it("can remove every image, because a product is allowed to have none", async () => {
    mediaFakes.updateResult = { images: [] };
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    await user.click(screen.getByRole("button", { name: /^Remove image 2/ }));
    await user.click(screen.getByRole("button", { name: /^Remove image 1/ }));
    await user.click(screen.getByRole("button", { name: "Save images" }));

    await waitFor(() => {
      const update = mediaFakes.calls.find((call) => call.method === "update");
      expect(update?.payload).toEqual({ id: "p1", images: [] });
    });
  });

  it("discards staged edits without touching the server", async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    await user.click(screen.getByRole("button", { name: /^Make image 2/ }));
    expect(screen.getByText(/unsaved/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByText(/unsaved/)).toBeNull();
    expect(altInputs()[0]).toHaveProperty("value", "Front view");
    expect(mediaFakes.calls.filter((call) => call.method === "update")).toHaveLength(0);
  });

  it("keeps the staged edit and shows the server message when a save is rejected", async () => {
    mediaFakes.updateError = new Error("Product image bbb is not owned by this product");
    const user = userEvent.setup();
    renderManager();
    await screen.findByDisplayValue("Side view");

    await user.click(screen.getByRole("button", { name: /^Make image 2/ }));
    await user.click(screen.getByRole("button", { name: "Save images" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Product image bbb is not owned by this product");
    // The edit is still staged, so the user can correct it rather than lose it.
    expect(screen.getByText(/unsaved/)).toBeTruthy();
    expect(altInputs()[0]).toHaveProperty("value", "Side view");
  });
});

describe("ProductImageManager — upload", () => {
  it("rejects a non-image file in the browser, without uploading it", async () => {
    renderManager();
    await screen.findByDisplayValue("Front view");

    const input = screen.getByLabelText("Choose product images to upload");
    const file = new File(["%PDF-1.4"], "brochure.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Only JPEG, PNG and WebP");
    // Nothing was sent: the file never left the browser.
    expect(mediaFakes.calls.filter((call) => call.method === "upload")).toHaveLength(0);
  });

  it("uploads an accepted file with alt text seeded from the product name", async () => {
    mediaFakes.uploadResult = {
      images: [
        image("aaa", 0, "Front view"),
        image("ccc", 1, "Emerald Halo Ring product image"),
      ],
    };
    renderManager();
    await screen.findByDisplayValue("Front view");

    const input = screen.getByLabelText("Choose product images to upload");
    const file = new File([new Uint8Array([1, 2, 3])], "ring.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const upload = mediaFakes.calls.find((call) => call.method === "upload");
      expect(upload?.payload).toEqual({
        id: "p1",
        name: "ring.png",
        type: "image/png",
        // Staff should not have to type alt text for every file.
        alt: "Emerald Halo Ring product image",
      });
    });
    expect(await screen.findByDisplayValue("Emerald Halo Ring product image")).toBeTruthy();
  });

  it("disables the upload control once the per-product maximum is reached", async () => {
    mediaFakes.listResult = {
      images: Array.from({ length: 10 }, (_, index) =>
        image(`img-${index}`, index, `Image ${index}`)
      ),
    };
    renderManager();
    await screen.findByDisplayValue("Image 0");
    expect(screen.getByText("10/10")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload image" })).toHaveProperty(
      "disabled",
      true
    );
  });

  it("reports a rejected upload by file name and keeps the existing list", async () => {
    mediaFakes.uploadError = new Error("Unsupported image type: only JPEG, PNG and WebP");
    renderManager();
    await screen.findByDisplayValue("Front view");

    const input = screen.getByLabelText("Choose product images to upload");
    const file = new File([new Uint8Array([1])], "huge.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("huge.png");
    expect(alert.textContent).toContain("Unsupported image type");
    // The images that were already attached are untouched.
    expect(screen.getByDisplayValue("Front view")).toBeTruthy();
  });
});

describe("ProductImageManager — preview", () => {
  it("previews each image with a resolvable absolute URL and its alt text", async () => {
    renderManager();
    await screen.findByDisplayValue("Front view");

    const previews = screen.getAllByTestId("next-image");
    expect(previews.length).toBeGreaterThanOrEqual(2);
    // Without resolveMediaUrl these stay root-relative and 404 in the
    // management app's own origin.
    expect(previews[0]).toHaveProperty("src", `${API_ORIGIN}/media/aaa.png`);
    expect(previews[0]).toHaveProperty("alt", "Front view");
  });

  it("falls back to a numbered description when alt text is blank", async () => {
    mediaFakes.listResult = { images: [image("aaa", 0, "")] };
    renderManager();
    await screen.findByDisplayValue("");
    expect(screen.getByTestId("next-image")).toHaveProperty(
      "alt",
      "Emerald Halo Ring image 1"
    );
  });

  it("shows the styled fallback, not a broken image, when a preview fails", async () => {
    renderManager();
    await screen.findByDisplayValue("Front view");

    fireEvent.error(screen.getAllByTestId("next-image")[0]);

    expect(screen.getAllByTestId("product-image-fallback").length).toBeGreaterThan(0);
  });
});
