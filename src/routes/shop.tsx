import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/shop.html?raw";

export const Route = createFileRoute("/shop")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateShop } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateShop(html);
        return new Response(body, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
