import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/portfolio.html?raw";

export const Route = createFileRoute("/portfolio")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
