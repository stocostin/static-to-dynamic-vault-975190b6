// Public passthrough for images stored in the private `admin-uploads` bucket.
// Files are uploaded through the CMS media manager; the frontend references
// them at /media/<storage_path>.
import { createFileRoute } from "@tanstack/react-router";

function contentTypeFor(path: string): string {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "svg": return "image/svg+xml";
    case "avif": return "image/avif";
    default: return "application/octet-stream";
  }
}

export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat ?? "";
        if (!splat || splat.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("admin-uploads").download(splat);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": contentTypeFor(splat),
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
