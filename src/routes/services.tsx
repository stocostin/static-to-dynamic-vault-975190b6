import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/services.html?raw";

export const Route = createFileRoute("/services")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
