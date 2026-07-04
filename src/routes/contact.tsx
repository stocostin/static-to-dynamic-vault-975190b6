import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/contact.html?raw";

export const Route = createFileRoute("/contact")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
