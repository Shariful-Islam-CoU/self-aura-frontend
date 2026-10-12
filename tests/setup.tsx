import "@testing-library/dom";
import type { ComponentProps } from "react";

/**
 * Test environment shims for the management app component tests.
 *
 * `next/image` is stubbed for the same reason as in the storefront: the tests
 * are about which image the management UI chooses and how it degrades, not about
 * Next's optimizer. Keeping the real handlers wired up lets a test fire
 * `load`/`error` and assert the loading skeleton and the styled fallback.
 */
type MockImageProps = {
  src: string;
  alt: string;
  onError?: () => void;
  onLoad?: () => void;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  className?: string;
};

/**
 * A plain `<img>` stands in for `next/image`. That is the whole point of the
 * stub, so the `no-img-element` rule is disabled here rather than silenced
 * project-wide.
 */
const MockImage = ({
  src,
  alt,
  onError,
  onLoad,
  sizes,
  priority,
  className,
}: MockImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element -- deliberate stub, see above.
  <img
    data-testid="next-image"
    data-src={src}
    data-sizes={sizes}
    data-priority={priority ? "true" : undefined}
    src={src}
    alt={alt}
    className={className}
    onLoad={onLoad}
    onError={onError}
  />
);

vi.mock("next/image", () => ({
  default: (props: MockImageProps) => <MockImage {...props} />,
  getImageProps: (props: Record<string, unknown>) => ({ props }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: ComponentProps<"a">["children"];
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * The media managers talk to the real `productService` / `categoryService`,
 * which talk to the real `apiClient` -> `fetch` (or `XMLHttpRequest` for an
 * upload). Tests replace these with controllable fakes so each component's
 * loading / saving / error states can be driven deterministically without a
 * server.
 */
export interface FakeMediaCall {
  method:
    | "list"
    | "upload"
    | "update"
    | "delete"
    | "listVideos"
    | "uploadVideo"
    | "updateVideos"
    | "uploadThumbnail"
    | "updateThumbnailAlt"
    | "deleteThumbnail";
  payload?: unknown;
}

export interface FakeMediaService {
  listProductImages: (id: string) => Promise<{ images: unknown[] }>;
  uploadProductImage: (
    id: string,
    file: File,
    alt?: string,
    onProgress?: (percent: number) => void
  ) => Promise<{ images: unknown[] }>;
  updateProductImages: (
    id: string,
    images: { key: string; alt?: string }[]
  ) => Promise<{ images: unknown[] }>;
  deleteProductImage: (id: string, key: string) => Promise<{ images: unknown[] }>;
  listProductVideos: (id: string) => Promise<{ videos: unknown[] }>;
  uploadProductVideo: (
    id: string,
    file: File,
    alt?: string,
    onProgress?: (percent: number) => void
  ) => Promise<{ videos: unknown[] }>;
  updateProductVideos: (
    id: string,
    videos: { key: string; alt?: string }[]
  ) => Promise<{ videos: unknown[] }>;
  deleteProductVideo: (id: string, key: string) => Promise<{ videos: unknown[] }>;
}

const calls: FakeMediaCall[] = [];

/** Set the next response for any media call, or make it reject. */
export const mediaFakes = {
  calls,
  listResult: null as { images: unknown[] } | null,
  listError: null as Error | null,
  uploadResult: null as { images: unknown[] } | null,
  uploadError: null as Error | null,
  updateResult: null as { images: unknown[] } | null,
  updateError: null as Error | null,
  /**
   * Percentages fed to the upload progress callback, in order. A test sets
   * `[25, 90]` to prove the bar actually MOVES, not just that it exists.
   */
  uploadProgress: [50] as number[],
  videoListResult: null as { videos: unknown[] } | null,
  videoListError: null as Error | null,
  videoUploadResult: null as { videos: unknown[] } | null,
  videoUploadError: null as Error | null,
  videoUpdateResult: null as { videos: unknown[] } | null,
  videoUpdateError: null as Error | null,
  reset() {
    calls.length = 0;
    this.listResult = { images: [] };
    this.listError = null;
    this.uploadResult = { images: [] };
    this.uploadError = null;
    this.updateResult = { images: [] };
    this.updateError = null;
    this.uploadProgress = [50];
    this.videoListResult = { videos: [] };
    this.videoListError = null;
    this.videoUploadResult = { videos: [] };
    this.videoUploadError = null;
    this.videoUpdateResult = { videos: [] };
    this.videoUpdateError = null;
  },
};

const fakeService: FakeMediaService = {
  async listProductImages(id) {
    calls.push({ method: "list", payload: id });
    if (mediaFakes.listError) throw mediaFakes.listError;
    return mediaFakes.listResult ?? { images: [] };
  },
  async uploadProductImage(id, file, alt, onProgress) {
    calls.push({ method: "upload", payload: { id, name: file.name, type: file.type, alt } });
    for (const percent of mediaFakes.uploadProgress) onProgress?.(percent);
    if (mediaFakes.uploadError) throw mediaFakes.uploadError;
    return mediaFakes.uploadResult ?? { images: [] };
  },
  async updateProductImages(id, images) {
    calls.push({ method: "update", payload: { id, images } });
    if (mediaFakes.updateError) throw mediaFakes.updateError;
    return mediaFakes.updateResult ?? { images: [] };
  },
  async deleteProductImage(id, key) {
    calls.push({ method: "delete", payload: { id, key } });
    return { images: [] };
  },
  async listProductVideos(id) {
    calls.push({ method: "listVideos", payload: id });
    if (mediaFakes.videoListError) throw mediaFakes.videoListError;
    return mediaFakes.videoListResult ?? { videos: [] };
  },
  async uploadProductVideo(id, file, alt, onProgress) {
    calls.push({ method: "uploadVideo", payload: { id, name: file.name, type: file.type, alt } });
    for (const percent of mediaFakes.uploadProgress) onProgress?.(percent);
    if (mediaFakes.videoUploadError) throw mediaFakes.videoUploadError;
    return mediaFakes.videoUploadResult ?? { videos: [] };
  },
  async updateProductVideos(id, videos) {
    calls.push({ method: "updateVideos", payload: { id, videos } });
    if (mediaFakes.videoUpdateError) throw mediaFakes.videoUpdateError;
    return mediaFakes.videoUpdateResult ?? { videos: [] };
  },
  async deleteProductVideo(id, key) {
    calls.push({ method: "delete", payload: { id, key } });
    return { videos: [] };
  },
};

vi.mock("@/features/products/services/productService", () => ({
  productService: fakeService,
  ProductService: class {},
}));

/**
 * Category thumbnails, faked on the same pattern. Every method resolves with a
 * `thumbnail` field because that is the shape the manager reads back to keep
 * the dialog, the form and the table showing the same thing.
 */
export const categoryFakes = {
  calls: [] as FakeMediaCall[],
  uploadResult: null as { thumbnail: unknown } | null,
  uploadError: null as Error | null,
  altResult: null as { thumbnail: unknown } | null,
  altError: null as Error | null,
  deleteResult: null as { thumbnail: unknown } | null,
  deleteError: null as Error | null,
  /** A placeholder thumbnail shaped like the management API's response. */
  thumbnail(overrides: Record<string, unknown> = {}) {
    return {
      url: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/c_limit,w_2000/v1/self-aura/categories/c1/thumbnail/a1.png",
      alt: "Sarees on display",
      publicId: "self-aura/categories/c1/thumbnail/a1",
      managed: true,
      ...overrides,
    };
  },
  reset() {
    this.calls.length = 0;
    this.uploadResult = { thumbnail: this.thumbnail() };
    this.uploadError = null;
    this.altResult = { thumbnail: this.thumbnail() };
    this.altError = null;
    this.deleteResult = { thumbnail: null };
    this.deleteError = null;
  },
};

vi.mock("@/features/categories/services/categoryService", () => ({
  categoryService: {
    async uploadCategoryThumbnail(id: string, file: File, alt?: string) {
      categoryFakes.calls.push({
        method: "uploadThumbnail",
        payload: { id, name: file.name, type: file.type, alt },
      });
      if (categoryFakes.uploadError) throw categoryFakes.uploadError;
      return categoryFakes.uploadResult ?? { thumbnail: null };
    },
    async deleteCategoryThumbnail(id: string) {
      categoryFakes.calls.push({ method: "deleteThumbnail", payload: id });
      if (categoryFakes.deleteError) throw categoryFakes.deleteError;
      return categoryFakes.deleteResult ?? { thumbnail: null };
    },
    async updateCategoryThumbnailAlt(id: string, alt: string) {
      categoryFakes.calls.push({ method: "updateThumbnailAlt", payload: { id, alt } });
      if (categoryFakes.altError) throw categoryFakes.altError;
      return categoryFakes.altResult ?? { thumbnail: null };
    },
  },
  CategoryService: class {},
}));
