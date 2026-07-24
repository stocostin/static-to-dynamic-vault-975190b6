import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/about.html?raw";
import { legacyHtmlHeaders } from "@/lib/legacy-response";

export const Route = createFileRoute("/about")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateAbout } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateAbout(html);
        return new Response(body, { headers: legacyHtmlHeaders() });
      },
    },
  },
});
