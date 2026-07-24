import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/blog.html?raw";
import { legacyHtmlHeaders } from "@/lib/legacy-response";

export const Route = createFileRoute("/blog/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { hydrateBlogPost } = await import("@/lib/legacy-hydrate.server");
        const { body, status } = await hydrateBlogPost(html, params.slug);
        return new Response(body, { status, headers: legacyHtmlHeaders() });
      },
    },
  },
});
