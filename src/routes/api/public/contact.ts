import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  service: z.string().trim().max(100).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          const ct = request.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) body = await request.json();
          else {
            const fd = await request.formData();
            body = Object.fromEntries(fd.entries());
          }
        } catch {
          return new Response(JSON.stringify({ error: "Invalid body" }), {
            status: 400,
            headers: { "content-type": "application/json", ...CORS },
          });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }),
            { status: 400, headers: { "content-type": "application/json", ...CORS } },
          );
        }
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) {
          return new Response(JSON.stringify({ error: "Server not configured" }), {
            status: 500,
            headers: { "content-type": "application/json", ...CORS },
          });
        }
        const sb = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const d = parsed.data;
        const { error } = await sb.from("contact_messages").insert({
          name: d.name,
          phone: d.phone || null,
          email: d.email || "",
          subject: d.service ? `Interest: ${d.service}` : null,
          message: d.message,
          source_page: "/contact",
        });
        if (error) {
          console.error("[contact] insert failed", error);
          return new Response(JSON.stringify({ error: "Could not save message" }), {
            status: 500,
            headers: { "content-type": "application/json", ...CORS },
          });
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json", ...CORS },
        });
      },
    },
  },
});
