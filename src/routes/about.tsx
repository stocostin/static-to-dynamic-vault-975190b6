import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/about.html?raw";

export const Route = createFileRoute("/about")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateAbout } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateAbout(html);
        return new Response(body, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
