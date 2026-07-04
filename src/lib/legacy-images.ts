// Temporary Phase-1 manifest of every image path referenced by the legacy
// static site (src/legacy/*.html + public/assets/css/*). Used by the
// /admin/legacy-images uploader and the /assets/images/* server route.
export const LEGACY_IMAGE_PATHS: readonly string[] = [
  "blog/article1.jpg",
  "blog/article2.jpg",
  "blog/article3.jpg",
  "blog/article4.jpg",
  "blog/article5.jpg",
  "blog/featured-article.jpg",
  "door-sample.jpg",
  "frame-sample.jpg",
  "furniture-sample.jpg",
  "hero-bg.jpg",
  "hero-bg2.jpg",
  "hero-bg3.jpg",
  "logo.png",
  "portfolio/custom19-thumb.jpg",
  "portfolio/custom19.jpg",
  "portfolio/custom2-thumb.jpg",
  "portfolio/custom2.jpg",
  "portfolio/custom43-thumb.jpg",
  "portfolio/custom43.jpg",
  "portfolio/door1-thumb.jpg",
  "portfolio/door1.jpg",
  "portfolio/door3-thumb.jpg",
  "portfolio/door3.jpg",
  "portfolio/furniture1-thumb.jpg",
  "portfolio/furniture1.jpg",
  "portfolio/staircase1-thumb.jpg",
  "portfolio/staircase1.jpg",
  "portfolio/staircase2-thumb.jpg",
  "portfolio/staircase2.jpg",
  "qr-code.png",
  "staircase-sample.jpg",
  "team1.jpg",
  "team2.jpg",
  "team3.jpg",
  "workshop.jpg",
] as const;

export const LEGACY_STORAGE_PREFIX = "legacy/assets/images/";

export function contentTypeFor(path: string): string {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}
