import type { NextConfig } from "next";

/**
 * The object form of a `remotePatterns` entry, taken straight from the
 * NextConfig type rather than re-declared, so a change in Next's image config
 * shape surfaces here as a type error instead of a runtime surprise.
 */
type RemotePattern = Exclude<
  NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number],
  URL
>;

/** Cloudinary's single delivery host. Delivery is always over HTTPS. */
const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Cloudinary cloud names are lowercase alphanumerics and hyphens.
 *
 * The value is interpolated into a `pathname`, so it is validated rather than
 * trusted: a malformed value must be dropped, not turned into a pattern that
 * matches more of the delivery host than intended.
 */
const CLOUD_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

/**
 * Trusted remote image hosts for `next/image` in the management app.
 *
 * Two sources, both narrow:
 *
 *  1. **Cloudinary's delivery host**, scoped to THIS deployment's cloud name and
 *     to the two upload paths the backend produces:
 *     `/{cloud}/image/upload/**` (product photos, category thumbnails, and video
 *     poster frames) and `/{cloud}/video/upload/**`. The cloud name is the only
 *     piece of the credential set a browser ever needs - it is already part of
 *     every delivery URL - and the API key and secret stay on the server, so no
 *     client-side credential is involved anywhere in this configuration.
 *
 *  2. **The API origin** plus any explicitly configured extras, for records
 *     written by the previous local-filesystem adapter. Those still resolve
 *     through `resolveMediaUrl()` in `src/features/products/lib/media.ts`.
 *
 * This is an ALLOW-LIST of specific origins and paths. The earlier
 * `https://*.amazonaws.com` pattern is gone: this system does not use S3, so
 * allowing every bucket in the world only widened the attack surface, and a
 * wildcard hostname would do the same here. A new trusted media host is added
 * deliberately through `NEXT_PUBLIC_MEDIA_HOSTS`.
 */
function readRemoteImagePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [];

  const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "").trim();
  if (CLOUD_NAME_PATTERN.test(cloudName)) {
    // Two separate path scopes rather than one `/{cloud}/**`: this keeps the
    // allow-list to exactly the trees the backend writes into.
    patterns.push(
      {
        protocol: "https",
        hostname: CLOUDINARY_HOST,
        port: "",
        pathname: `/${cloudName}/image/upload/**`,
      },
      {
        protocol: "https",
        hostname: CLOUDINARY_HOST,
        port: "",
        // Video poster frames are JPEGs delivered from the video tree, which is
        // why this path is needed even though <Image> never renders a video.
        pathname: `/${cloudName}/video/upload/**`,
      }
    );
  } else if (cloudName.length > 0) {
    // Loudly useless rather than silently permissive: a typo here would
    // otherwise show up much later as a Next image error at runtime.
    console.warn(
      "[next.config] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not a valid Cloudinary cloud name; " +
        "Cloudinary images will not be optimised by next/image."
    );
  }

  const addFromUrl = (value: string | undefined) => {
    if (!value) return;
    try {
      const url = new URL(value);
      const protocol = url.protocol.replace(":", "");
      if (protocol !== "http" && protocol !== "https") return;
      patterns.push({
        protocol,
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
      });
    } catch {
      // A malformed URL is ignored rather than silently allowing everything.
    }
  };

  addFromUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api");

  for (const entry of (process.env.NEXT_PUBLIC_MEDIA_HOSTS ?? "").split(",")) {
    const trimmed = entry.trim();
    if (trimmed.length > 0) addFromUrl(trimmed);
  }

  for (const host of ["localhost", "127.0.0.1"]) {
    if (!patterns.some((pattern) => pattern.hostname === host)) {
      patterns.push({ protocol: "http", hostname: host });
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // This project sits beside the backend in a multi-lockfile workspace;
  // pin Turbopack's root to this project so it doesn't infer the parent
  // directory as the application root.
  turbopack: {
    root: __dirname,
  },

  // Product thumbnails, category thumbnails and the media-manager previews are
  // optimised through the Next image pipeline (resized per `sizes`, modern
  // format). `unoptimized` is deliberately NOT set: the delivery host is an
  // allow-listed remote pattern, so optimisation works without it, and leaving
  // it off means a 4000px Cloudinary master never reaches the browser whole.
  images: {
    remotePatterns: readRemoteImagePatterns(),
  },

  // Environment variables that should be available to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },
};

export default nextConfig;
