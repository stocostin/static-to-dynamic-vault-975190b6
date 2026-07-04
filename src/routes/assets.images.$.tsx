// Temporary Phase-1 route: serves legacy images uploaded via /admin/legacy-images
// out of the private `admin-uploads` Supabase Storage bucket, at their original
// paths (e.g. GET /assets/images/hero-bg.jpg). Remove once images move into the
// CMS media library.
import { createFileRoute } from "@tanstack/react-router";
import { LEGACY_STORAGE_PREFIX, contentTypeFor } from "@/lib/legacy-images";

export const Route = createFileRoute("/assets/images/$")({
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
          .download(LEGACY_STORAGE_PREFIX + splat);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": contentTypeFor(splat),
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
