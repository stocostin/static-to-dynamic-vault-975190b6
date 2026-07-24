import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/portfolio.html?raw";

export const Route = createFileRoute("/portfolio")({
  server: {
    handlers: {
      GET: async () => {
        const { hydratePortfolio } = await import("@/lib/legacy-hydrate.server");
        const body = await hydratePortfolio(html);
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
