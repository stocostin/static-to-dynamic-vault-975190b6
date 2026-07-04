import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/blog.html?raw";

export const Route = createFileRoute("/blog")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateBlog } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateBlog(html);
        return new Response(body, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
