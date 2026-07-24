import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/shop.html?raw";
import { legacyHtmlHeaders } from "@/lib/legacy-response";

export const Route = createFileRoute("/shop")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateShop } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateShop(html);
        return new Response(body, { headers: legacyHtmlHeaders() });
      },
    },
  },
});
