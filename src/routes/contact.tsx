import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/contact.html?raw";
import { legacyHtmlHeaders } from "@/lib/legacy-response";

export const Route = createFileRoute("/contact")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateContact } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateContact(html);
        return new Response(body, { headers: legacyHtmlHeaders() });
      },
    },
  },
});
