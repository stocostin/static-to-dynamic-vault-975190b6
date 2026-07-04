import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/about.html?raw";

export const Route = createFileRoute("/about")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
