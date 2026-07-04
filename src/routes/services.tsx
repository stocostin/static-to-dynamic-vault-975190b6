import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/services.html?raw";

export const Route = createFileRoute("/services")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateServices } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateServices(html);
        return new Response(body, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
