import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryThumbnailManager } from "@/features/categories/components/CategoryThumbnailManager";
import { categoryFakes } from "./setup";
import { deferred } from "./deferred";
import type { CategoryThumbnail } from "@/features/categories/types";

/**
 * Component tests for the management category thumbnail control.
 *
 * The properties that matter here are specific to "at most one thumbnail":
 * replacing must be visibly a replace, a legacy record must be labelled as
 * somebody else's bytes, and every failure must be reported rather than
 * swallowed. A thumbnail is optional, so the empty state has to be a genuinely
 * comfortable place to be.
 */

const managed: CategoryThumbnail = {
  url: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/c_limit,w_2000/v1/self-aura/categories/c1/thumbnail/a1.png",
  alt: "Sarees on display",
  publicId: "self-aura/categories/c1/thumbnail/a1",
  managed: true,
};

const legacy: CategoryThumbnail = {
  url: "https://example.com/legacy/category.jpg",
  alt: "Old category photo",
  managed: false,
};

interface Handlers {
  onChanged: (thumbnail: CategoryThumbnail | null) => void;
}

function renderManager(thumbnail: CategoryThumbnail | null, handlers?: Partial<Handlers>) {
  const onChanged = vi.fn();
  render(
    <CategoryThumbnailManager
      categoryId="c1"
      categoryName="Sarees"
      thumbnail={thumbnail}
      onChanged={onChanged}
      {...handlers}
    />
  );
  return { onChanged };
}

const png = (name = "thumb.png", type = "image/png") =>
  new File([new Uint8Array(512)], name, { type });

const fileInput = () =>
  screen.getByLabelText("Choose a category thumbnail to upload") as HTMLInputElement;

/** Feeds a file into the hidden input the way a picker would. */
const chooseFile = (file: File) => {
  fireEvent.change(fileInput(), { target: { files: [file] } });
};

beforeEach(() => {
  categoryFakes.reset();
});

afterEach(() => {
  cleanup();
});

describe("CategoryThumbnailManager — empty state", () => {
  it("invites an upload and explains that a thumbnail is optional", () => {
    renderManager(null);
    expect(screen.getByRole("button", { name: /upload/i })).toBeTruthy();
    expect(screen.getByText(/branded placeholder/)).toBeTruthy();
    // A single file picker: there is nothing to add a second one TO.
    expect(fileInput().hasAttribute("multiple")).toBe(false);
  });

  it("shows no image and no remove control when there is no thumbnail", () => {
    renderManager(null);
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });
});

describe("CategoryThumbnailManager — current thumbnail", () => {
  it("shows the stored image so a replace is never a blind action", () => {
    renderManager(managed);
    const image = screen.getByTestId("next-image");
    expect(image.getAttribute("data-src")).toContain("res.cloudinary.com");
    expect(screen.getByRole("button", { name: /replace/i })).toBeTruthy();
  });

  it("describes the image with the stored alt text", () => {
    renderManager(managed);
    expect(screen.getByTestId("next-image").getAttribute("alt")).toBe("Sarees on display");
  });

  it("falls back to a category-derived description rather than an empty alt", () => {
    // A record written before alt text was captured: an empty `alt` is announced
    // as an unlabelled image, which is worse than a derived one.
    renderManager({ url: "https://example.com/a.jpg", managed: false });
    expect(screen.getByTestId("next-image").getAttribute("alt")).toBe("Sarees category");
  });

  it("labels a thumbnail this deployment does not own as external", () => {
    renderManager(legacy);
    expect(screen.getByText("External")).toBeTruthy();
    expect(screen.queryByText("Stored")).toBeNull();
  });

  it("labels a Cloudinary-hosted thumbnail as stored", () => {
    renderManager(managed);
    expect(screen.getByText("Stored")).toBeTruthy();
  });
});

describe("CategoryThumbnailManager — upload", () => {
  it("uploads a chosen file and adopts the server's response", async () => {
    const { onChanged } = renderManager(null);

    chooseFile(png());

    await waitFor(() =>
      expect(categoryFakes.calls).toEqual([
        {
          method: "uploadThumbnail",
          payload: { id: "c1", name: "thumb.png", type: "image/png", alt: undefined },
        },
      ])
    );
    // The server's answer wins, so the dialog and the table cannot disagree
    // with what was actually stored.
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(categoryFakes.thumbnail()));
  });

  it("confirms a first upload", async () => {
    renderManager(null);
    chooseFile(png());
    expect(await screen.findByText(/Thumbnail uploaded/)).toBeTruthy();
  });

  it("sends the edited description along with a replacement", async () => {
    const { onChanged } = renderManager(managed);

    const altInput = screen.getByLabelText("Alt text for the category thumbnail");
    await userEvent.clear(altInput);
    await userEvent.type(altInput, "Handwoven silk on a rail");
    chooseFile(png("new.png"));

    await waitFor(() => {
      const call = categoryFakes.calls.find((entry) => entry.method === "uploadThumbnail");
      expect(call?.payload).toEqual({
        id: "c1",
        name: "new.png",
        type: "image/png",
        alt: "Handwoven silk on a rail",
      });
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it("reports a replacement, including that the previous file is gone", async () => {
    renderManager(managed);
    chooseFile(png("new.png"));
    expect(await screen.findByText(/previous file was removed/)).toBeTruthy();
  });

  it("refuses a file the server would reject, without uploading it", async () => {
    renderManager(null);
    // The picker filter is a convenience, not the control: this is the code path
    // that keeps a wrong file from ever being sent.
    chooseFile(new File([new Uint8Array(8)], "logo.svg", { type: "image/svg+xml" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Only JPEG, PNG and WebP"
    );
    expect(categoryFakes.calls).toHaveLength(0);
  });

  it("surfaces the server's rejection message verbatim", async () => {
    renderManager(null);
    categoryFakes.uploadError = new Error("Category thumbnail must be JPEG, PNG or WebP");
    chooseFile(png());
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Category thumbnail must be JPEG, PNG or WebP"
    );
  });

  it("disables every control while the upload is in flight", async () => {
    renderManager(null);

    const upload = deferred<{ thumbnail: CategoryThumbnail }>();
    categoryFakes.uploadResult = upload.promise as never;

    chooseFile(png());
    await waitFor(() => expect(fileInput().disabled).toBe(true));
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
    expect(screen.getByRole("progressbar")).toBeTruthy();

    upload.resolve({ thumbnail: managed });
    await waitFor(() => expect(fileInput().disabled).toBe(false));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

describe("CategoryThumbnailManager — description", () => {
  it("saves a description without re-uploading the file", async () => {
    // A caption is metadata, not media: re-uploading to change one would delete
    // and re-store the asset for nothing.
    const { onChanged } = renderManager(managed);
    const altInput = screen.getByLabelText("Alt text for the category thumbnail");

    await userEvent.clear(altInput);
    await userEvent.type(altInput, "Sarees folded on a shelf");
    await userEvent.click(screen.getByRole("button", { name: /save description/i }));

    await waitFor(() =>
      expect(categoryFakes.calls).toEqual([
        {
          method: "updateThumbnailAlt",
          payload: { id: "c1", alt: "Sarees folded on a shelf" },
        },
      ])
    );
    expect(onChanged).toHaveBeenCalled();
    expect(await screen.findByText(/description saved/i)).toBeTruthy();
  });

  it("cannot submit the description unless it actually changed", async () => {
    renderManager(managed);
    const save = screen.getByRole("button", { name: /save description/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);

    const altInput = screen.getByLabelText("Alt text for the category thumbnail");
    await userEvent.type(altInput, "!");
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps the edited text visible when the save is rejected", async () => {
    renderManager(managed);
    categoryFakes.altError = new Error("This category has no thumbnail");

    const altInput = screen.getByLabelText("Alt text for the category thumbnail");
    await userEvent.clear(altInput);
    await userEvent.type(altInput, "Will not save");
    await userEvent.click(screen.getByRole("button", { name: /save description/i }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "This category has no thumbnail"
    );
    expect(altInput).toHaveProperty("value", "Will not save");
  });
});

describe("CategoryThumbnailManager — removal", () => {
  it("clears the reference and returns null to the caller", async () => {
    const { onChanged } = renderManager(managed);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() =>
      expect(categoryFakes.calls).toEqual([{ method: "deleteThumbnail", payload: "c1" }])
    );
    expect(onChanged).toHaveBeenCalledWith(null);
    expect(await screen.findByText(/Thumbnail removed/)).toBeTruthy();
  });

  it("returns to the empty state once the parent adopts the cleared value", async () => {
    // The control is a controlled child: it reports the new value and the
    // parent feeds it back. This harness is what `CategoryDialog` does, and it
    // is the only way the empty state can legitimately appear - the component
    // must not keep showing an image the server has already forgotten.
    function Harness() {
      const [thumbnail, setThumbnail] = useState<CategoryThumbnail | null>(managed);
      return (
        <CategoryThumbnailManager
          categoryId="c1"
          categoryName="Sarees"
          thumbnail={thumbnail}
          onChanged={setThumbnail}
        />
      );
    }

    render(<Harness />);
    expect(screen.getByTestId("next-image")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => expect(screen.queryByTestId("next-image")).toBeNull());
    expect(screen.getByRole("button", { name: /upload/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
  });

  it("surfaces a removal failure and keeps the thumbnail on screen", async () => {
    const { onChanged } = renderManager(managed);
    categoryFakes.deleteError = new Error("Category not found");

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect((await screen.findByRole("alert")).textContent).toContain("Category not found");
    // The user must not be left believing the image is gone when it is not.
    expect(screen.getByTestId("next-image")).toBeTruthy();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
