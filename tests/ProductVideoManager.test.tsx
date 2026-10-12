import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductVideoManager } from "@/features/products/components/ProductVideoManager";
import { mediaFakes } from "./setup";
import { deferred } from "./deferred";
import type { ManagedProductVideo } from "@/features/products/types";

/**
 * Component tests for the management product VIDEO manager.
 *
 * The video manager deliberately mirrors the image manager, so these focus on
 * the places where the two differ and on the states the requirements call for:
 * upload with a real progress percentage, in-progress disabling, a poster-frame
 * preview that never autoplays, and the ordered save.
 */

const VIDEO_URL = "https://res.cloudinary.com/demo/video/upload/f_mp4/v1/self-aura/products/p1/videos/v1.mp4";
const POSTER_URL =
  "https://res.cloudinary.com/demo/video/upload/so_1,f_jpg/v1/self-aura/products/p1/videos/v1.jpg";

function video(key: string, sortOrder: number, alt: string): ManagedProductVideo {
  return {
    key,
    url: `${VIDEO_URL}?k=${key}`,
    thumbnailUrl: `${POSTER_URL}?k=${key}`,
    alt,
    sortOrder,
    mimeType: "video/mp4",
    duration: 12,
    managed: true,
  };
}

const renderManager = () =>
  render(<ProductVideoManager productId="p1" productName="Emerald Halo Ring" />);

/** A real File, so `name` and `type` behave as they do in a browser. */
const mp4 = (name = "clip.mp4", type = "video/mp4") =>
  new File([new Uint8Array(1024)], name, { type });

const altInputs = () => screen.getAllByLabelText(/^Description for video \d+$/);
const fileInput = () =>
  screen.getByLabelText("Choose product videos to upload") as HTMLInputElement;

/**
 * Feeds files into the hidden input the way a picker would.
 *
 * A plain array stands in for a `FileList`: the component only ever reads
 * `files.length` and iterates it, and jsdom has no `DataTransfer`.
 */
const chooseFiles = (files: File[]) => {
  fireEvent.change(fileInput(), { target: { files } });
};

beforeEach(() => {
  mediaFakes.reset();
  mediaFakes.videoListResult = {
    videos: [video("aaa", 0, "Drape in motion"), video("bbb", 1, "Close-up")],
  };
});

afterEach(() => {
  cleanup();
});

describe("ProductVideoManager — loading", () => {
  it("loads the product's videos for the bound product id", async () => {
    renderManager();
    expect(await screen.findByDisplayValue("Drape in motion")).toBeTruthy();
    expect(mediaFakes.calls[0]).toEqual({ method: "listVideos", payload: "p1" });
    expect(altInputs()).toHaveLength(2);
  });

  it("shows a busy skeleton instead of the list while the request is in flight", () => {
    mediaFakes.videoListResult = new Promise(() => {}) as never;
    renderManager();
    expect(screen.getByTestId("product-videos-loading")).toBeTruthy();
    expect(screen.queryByLabelText("Description for video 1")).toBeNull();
    expect(screen.getByText("0/5")).toBeTruthy();
  });

  it("surfaces a load failure instead of claiming the product has no videos", async () => {
    mediaFakes.videoListError = new Error("Products: read failed");
    renderManager();
    expect((await screen.findByRole("alert")).textContent).toContain("Products: read failed");
    // "No videos yet" would be a false statement: the product may well have
    // videos, we simply could not read them.
    expect(screen.queryByText(/No videos yet/)).toBeNull();
  });

  it("tells the user when the product genuinely has no videos", async () => {
    mediaFakes.videoListResult = { videos: [] };
    renderManager();
    expect(await screen.findByText(/No videos yet/)).toBeTruthy();
  });
});

describe("ProductVideoManager — preview", () => {
  it("previews each video through its Cloudinary poster frame", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    const previews = screen.getAllByTestId("next-image");
    expect(previews).toHaveLength(2);
    expect(previews[0].getAttribute("data-src")).toContain("so_1,f_jpg");
  });

  it("never renders a <video> element, so nothing can autoplay with sound", async () => {
    const { container } = renderManager();
    await screen.findByDisplayValue("Drape in motion");
    expect(container.querySelectorAll("video")).toHaveLength(0);
    // And the copy states the rule, so a staff member is not left guessing
    // whether pressing play is expected.
    expect(screen.getByText(/never autoplayed/)).toBeTruthy();
  });

  it("shows a labelled placeholder rather than a broken image when there is no poster", async () => {
    mediaFakes.videoListResult = {
      videos: [{ ...video("aaa", 0, "No poster"), thumbnailUrl: undefined }],
    };
    renderManager();
    await screen.findByDisplayValue("No poster");
    // A legacy record has no Cloudinary poster, so the shared frame renders its
    // styled fallback - never a browser broken-image glyph, and never an empty
    // box that would collapse the row.
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByText("No preview")).toBeTruthy();
  });

  it("marks the poster as decorative, so the description is not read twice", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    // The row is already announced as "Video 1" with its description, so the
    // poster frame itself carries an empty alt.
    expect(screen.getAllByTestId("next-image")[0].getAttribute("alt")).toBe("");
  });
});

describe("ProductVideoManager — upload", () => {
  it("uploads a selected file with a default description and the file it chose", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    chooseFiles([mp4()]);

    await waitFor(() =>
      expect(mediaFakes.calls).toContainEqual({
        method: "uploadVideo",
        payload: {
          id: "p1",
          name: "clip.mp4",
          type: "video/mp4",
          alt: "Emerald Halo Ring product video",
        },
      })
    );
  });

  it("reports the percentage of the current file, not just which file", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    // No bar before anything is selected: a progress bar at rest is noise.
    expect(screen.queryByRole("progressbar")).toBeNull();

    // The upload is held open so the in-flight state is observable. The fake
    // replays the configured percentages, which is what a real transport does.
    const upload = deferred<{ videos: unknown[] }>();
    mediaFakes.videoUploadResult = upload.promise as never;
    mediaFakes.uploadProgress = [25, 90];

    chooseFiles([mp4()]);

    const bar = await screen.findByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("90");
    // Announced, not just painted: a screen reader reads the file name too.
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("clip.mp4");
    expect(status.textContent).toContain("90%");
    expect(bar.getAttribute("aria-label")).toContain("clip.mp4");

    upload.resolve({ videos: [video("ccc", 2, "Added clip")] });
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
  });

  it("reports position within a multi-file batch", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    const upload = deferred<{ videos: unknown[] }>();
    mediaFakes.videoUploadResult = upload.promise as never;
    mediaFakes.uploadProgress = [40];

    chooseFiles([mp4("first.mp4"), mp4("second.mp4")]);
    await waitFor(() => expect(screen.getByRole("progressbar")).toBeTruthy());
    expect(screen.getByRole("status").textContent).toContain("Uploading 1 of 2");

    upload.resolve({ videos: [] });
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
  });

  it("refuses a file whose browser-reported type is not a video, without uploading", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    chooseFiles([new File([new Uint8Array(8)], "sneaky.png", { type: "image/png" })]);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Only MP4, MOV and WebM"
    );
    expect(mediaFakes.calls.some((call) => call.method === "uploadVideo")).toBe(false);
  });

  it("skips only the unsupported files and still uploads the rest", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    mediaFakes.videoUploadResult = { videos: [video("ccc", 2, "Added clip")] };

    chooseFiles([
      new File([new Uint8Array(8)], "notes.txt", { type: "text/plain" }),
      mp4("good.mp4"),
    ]);

    await waitFor(() =>
      expect(mediaFakes.calls.filter((call) => call.method === "uploadVideo")).toHaveLength(1)
    );
    expect((await screen.findByRole("alert")).textContent).toContain("1 file was skipped");
  });

  it("surfaces the server's rejection message verbatim", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    mediaFakes.videoUploadError = new Error("Video is MP4, MOV or WebM only");

    chooseFiles([mp4()]);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("clip.mp4");
    expect(alert.textContent).toContain("Video is MP4, MOV or WebM only");
  });

  it("confirms a successful upload, and says where the file went", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    mediaFakes.videoUploadResult = { videos: [video("ccc", 2, "Added clip")] };
    chooseFiles([mp4()]);
    // Matched on the text rather than the role: the progress line is also a
    // `status` region and is still mounted for the same tick.
    const confirmation = await screen.findByText(/1 video uploaded/);
    expect(confirmation.textContent).toContain("media library");
  });
});

describe("ProductVideoManager — limits", () => {
  it("disables the upload control at the five-video ceiling", async () => {
    mediaFakes.videoListResult = {
      videos: [0, 1, 2, 3, 4].map((index) => video(`v${index}`, index, `Clip ${index + 1}`)),
    };
    renderManager();
    await screen.findByDisplayValue("Clip 1");
    expect(screen.getByRole("button", { name: /upload video/i })).toHaveProperty(
      "disabled",
      true
    );
    expect(fileInput().disabled).toBe(true);
  });

  it("refuses an over-limit batch without uploading the excess", async () => {
    mediaFakes.videoListResult = {
      videos: [0, 1, 2, 3, 4].map((index) => video(`v${index}`, index, `Clip ${index + 1}`)),
    };
    renderManager();
    await screen.findByDisplayValue("Clip 1");
    // The input is disabled, so a real user cannot even reach this; the guard is
    // asserted anyway because the handler is the actual enforcement point.
    chooseFiles([mp4("extra.mp4")]);
    expect(mediaFakes.calls.some((call) => call.method === "uploadVideo")).toBe(false);
  });
});

describe("ProductVideoManager — ordering and saving", () => {
  it("offers no 'make primary' action, because a video is never the card image", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    expect(screen.queryByText("Primary")).toBeNull();
  });

  it("stages a reorder and commits it as one ordered request", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    await userEvent.click(screen.getByRole("button", { name: "Move video 2 up" }));
    // Staged, not yet sent.
    expect(mediaFakes.calls.some((call) => call.method === "updateVideos")).toBe(false);
    expect(screen.getByText(/unsaved/)).toBeTruthy();

    mediaFakes.videoUpdateResult = {
      videos: [video("bbb", 0, "Close-up"), video("aaa", 1, "Drape in motion")],
    };
    await userEvent.click(screen.getByRole("button", { name: /save videos/i }));

    await waitFor(() => {
      const call = mediaFakes.calls.find((entry) => entry.method === "updateVideos");
      expect(call).toEqual({
        method: "updateVideos",
        payload: {
          id: "p1",
          videos: [
            { key: "bbb", alt: "Close-up" },
            { key: "aaa", alt: "Drape in motion" },
          ],
        },
      });
    });
  });

  it("sends the edited description together with the order, in one request", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    await userEvent.clear(altInputs()[0]);
    await userEvent.type(altInputs()[0], "Silk moving in the breeze");
    mediaFakes.videoUpdateResult = {
      videos: [video("aaa", 0, "Silk moving in the breeze"), video("bbb", 1, "Close-up")],
    };
    await userEvent.click(screen.getByRole("button", { name: /save videos/i }));

    await waitFor(() => {
      const call = mediaFakes.calls.find((entry) => entry.method === "updateVideos");
      expect((call?.payload as { videos: { alt: string }[] }).videos[0].alt).toBe(
        "Silk moving in the breeze"
      );
    });
  });

  it("discards staged changes without touching the server", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    await userEvent.click(screen.getByRole("button", { name: "Move video 2 up" }));
    await userEvent.click(screen.getByRole("button", { name: /discard changes/i }));

    expect(altInputs()[0]).toHaveProperty("value", "Drape in motion");
    expect(mediaFakes.calls.some((call) => call.method === "updateVideos")).toBe(false);
  });

  it("keeps a staged edit visible when the save is rejected", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    await userEvent.clear(altInputs()[0]);
    await userEvent.type(altInputs()[0], "Will not save");
    mediaFakes.videoUpdateError = new Error("Products: media write failed");
    await userEvent.click(screen.getByRole("button", { name: /save videos/i }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Products: media write failed"
    );
    // The user's work must survive a failed save.
    expect(altInputs()[0]).toHaveProperty("value", "Will not save");
  });

  it("enables Save only when something actually changed", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    expect(screen.getByRole("button", { name: /save videos/i })).toHaveProperty(
      "disabled",
      true
    );
  });
});

describe("ProductVideoManager — in-progress state", () => {
  it("disables every control while a save is in flight", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    const save = deferred<{ videos: unknown[] }>();
    mediaFakes.videoUpdateResult = save.promise as never;

    await userEvent.click(screen.getByRole("button", { name: "Move video 2 up" }));
    await userEvent.click(screen.getByRole("button", { name: /save videos/i }));

    // Every interactive control is off while the request is open, so a
    // double-click cannot queue a second write.
    for (const input of altInputs()) expect((input as HTMLInputElement).disabled).toBe(true);
    expect(fileInput().disabled).toBe(true);
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }

    save.resolve({ videos: [video("aaa", 0, "Drape in motion")] });
    await waitFor(() =>
      expect(altInputs()[0]).toHaveProperty("value", "Drape in motion")
    );
  });

  it("disables the upload controls while an upload is in flight", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    const upload = deferred<{ videos: unknown[] }>();
    mediaFakes.videoUploadResult = upload.promise as never;

    chooseFiles([mp4()]);

    await waitFor(() => expect(fileInput().disabled).toBe(true));
    expect(screen.getByRole("button", { name: /upload video/i })).toHaveProperty(
      "disabled",
      true
    );
    // The bar is up, and it is announced rather than being purely visual.
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("clip.mp4");

    upload.resolve({ videos: [video("ccc", 2, "Added clip")] });
    await waitFor(() => expect(fileInput().disabled).toBe(false));
  });
});

describe("ProductVideoManager — removal", () => {
  it("stages a removal and commits the shorter list", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");

    await userEvent.click(screen.getByRole("button", { name: "Remove video 1, Drape in motion" }));
    expect(altInputs()).toHaveLength(1);

    mediaFakes.videoUpdateResult = { videos: [video("bbb", 0, "Close-up")] };
    await userEvent.click(screen.getByRole("button", { name: /save videos/i }));

    await waitFor(() => {
      const call = mediaFakes.calls.find((entry) => entry.method === "updateVideos");
      expect(call?.payload).toEqual({
        id: "p1",
        videos: [{ key: "bbb", alt: "Close-up" }],
      });
    });
  });

  it("names the video in the remove control's accessible name", async () => {
    renderManager();
    await screen.findByDisplayValue("Drape in motion");
    expect(
      screen.getByRole("button", { name: "Remove video 2, Close-up" })
    ).toBeTruthy();
  });
});

describe("ProductVideoManager — unmanaged records", () => {
  it("labels a video this deployment does not own as external", async () => {
    mediaFakes.videoListResult = {
      videos: [
        {
          ...video("legacy", 0, "Old clip"),
          managed: false,
          thumbnailUrl: undefined,
        },
      ],
    };
    renderManager();
    await screen.findByDisplayValue("Old clip");
    expect(screen.getByText("External")).toBeTruthy();
  });
});
