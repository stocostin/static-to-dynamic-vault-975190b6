import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/blog.html?raw";

export const Route = createFileRoute("/blog")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
