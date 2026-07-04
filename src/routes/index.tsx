import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/index.html?raw";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateIndex } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateIndex(html);
        return new Response(body, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
