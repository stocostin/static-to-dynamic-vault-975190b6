import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/portfolio.html?raw";
import { legacyHtmlHeaders } from "@/lib/legacy-response";

export const Route = createFileRoute("/portfolio")({
  server: {
    handlers: {
      GET: async () => {
        const { hydratePortfolio } = await import("@/lib/legacy-hydrate.server");
        const body = await hydratePortfolio(html);
        return new Response(body, { headers: legacyHtmlHeaders() });
      },
    },
  },
});
