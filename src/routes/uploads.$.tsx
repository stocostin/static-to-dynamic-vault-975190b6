// Public proxy for the private `admin-uploads` Supabase Storage bucket.
// Workspace policy blocks flipping the bucket public, so we serve files
// through a server route that uses the service-role client. Store URLs
// as `/uploads/<storagePath>` and they'll load anywhere on the site.
import { createFileRoute } from "@tanstack/react-router";
import { contentTypeFor } from "@/lib/legacy-images";

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as { _splat?: string })._splat ?? "";
        if (!splat || splat.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data, error } = await supabaseAdmin.storage
          .from("admin-uploads")
          .download(splat);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": data.type || contentTypeFor(splat),
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
