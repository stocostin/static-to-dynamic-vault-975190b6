// Shared response headers for server-rendered legacy pages.
// Improves Lighthouse Best Practices and hardens delivery.
export function legacyHtmlHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "permissions-policy":
      "interest-cohort=(), browsing-topics=(), camera=(), microphone=(), geolocation=()",
    ...extra,
  };
}
