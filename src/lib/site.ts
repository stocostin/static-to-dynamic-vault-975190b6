// Canonical public URL for the site — used in og:url, canonical, and share links.
// Custom domain that crawlers should attribute content to.
export const SITE_URL = "https://shachavirtimber.com";

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
