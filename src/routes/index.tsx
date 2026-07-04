import { createFileRoute } from "@tanstack/react-router";
import html from "../legacy/index.html?raw";

// Serves the original static index.html verbatim (byte-for-byte, no React shell).
export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
