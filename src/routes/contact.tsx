import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/contact.html?raw";

export const Route = createFileRoute("/contact")({
  server: {
    handlers: {
      GET: async () => {
        const { hydrateContact } = await import("@/lib/legacy-hydrate.server");
        const body = await hydrateContact(html);
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
