import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

type ChatMessage = { role: "user" | "assistant"; content: string };

async function loadSiteContext() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const [settings, services, products, faqs] = await Promise.all([
      supabase.from("site_settings").select("key, value"),
      supabase
        .from("services")
        .select("title, short_description, category")
        .eq("is_published", true)
        .limit(30),
      supabase
        .from("shop_products")
        .select("title, description, price_cents, currency, category, in_stock")
        .eq("is_published", true)
        .limit(30),
      supabase
        .from("faqs")
        .select("question, answer, category")
        .eq("is_published", true)
        .limit(30),
    ]);

    const s: Record<string, string> = {};
    for (const row of settings.data ?? []) {
      const v = row.value as unknown;
      s[row.key] = typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
    }

    return {
      settings: s,
      services: services.data ?? [],
      products: products.data ?? [],
      faqs: faqs.data ?? [],
    };
  } catch (e) {
    console.error("[chat] context load failed", e);
    return { settings: {}, services: [], products: [], faqs: [] };
  }
}

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof loadSiteContext>>) {
  const s = ctx.settings;
  const priceLine = (p: { price_cents: number | null; currency: string }) =>
    p.price_cents != null ? `${p.currency} ${(p.price_cents / 100).toFixed(2)}` : "on request";

  const servicesText = ctx.services
    .map((x) => `- ${x.title}${x.category ? ` (${x.category})` : ""}: ${x.short_description ?? ""}`)
    .join("\n");
  const productsText = ctx.products
    .map(
      (p) =>
        `- ${p.title}${p.category ? ` (${p.category})` : ""} — ${priceLine(p)}${p.in_stock ? "" : " (out of stock)"}: ${p.description ?? ""}`,
    )
    .join("\n");
  const faqText = ctx.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  return `You are "Shachavir Assistant", the friendly online assistant for ${s.site_name || "Shachavir Timber Limited"}, a premium woodwork company in Kenya crafting custom doors, frames, staircases, and bespoke furniture.

Your job is to help visitors:
- Learn about services and pricing
- Recommend products and services based on their needs
- Answer common questions
- Guide them to the right page (/services, /portfolio, /shop, /blog, /contact)
- Encourage them to reach out via contact form, phone, WhatsApp, or email for quotes

Keep replies friendly, concise, and helpful. Use markdown (short lists, bold) when useful. Do not invent prices or product details that are not in the context. If something is unknown, direct the visitor to the Contact page or share the contact details below.

## Business details
- Site: ${s.site_name || "Shachavir Timber Limited"} — ${s.site_tagline || ""}
- Tagline: ${s.hero_title || ""} — ${s.hero_subtitle || ""}
- Email: ${s.contact_email || "not provided"}
- Phone: ${s.contact_phone || "not provided"}
- WhatsApp: ${s.whatsapp_number ? `https://wa.me/${s.whatsapp_number}` : "not provided"}
- Address: ${s.contact_address || "not provided"}
- Google Maps: ${s.google_maps_url || "not provided"}

## Services
${servicesText || "(no services listed)"}

## Shop products
${productsText || "(no products listed)"}

## FAQs
${faqText || "(no FAQs)"}

If the visitor asks something outside woodwork/the business, gently steer back to how you can help with Shachavir Timber's offerings.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: ChatMessage[] };
          const messages = Array.isArray(body.messages) ? body.messages : [];
          if (messages.length === 0) {
            return Response.json({ error: "messages required" }, { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return Response.json({ error: "LOVABLE_API_KEY missing" }, { status: 500 });
          }

          const ctx = await loadSiteContext();
          const system = buildSystemPrompt(ctx);

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const result = await generateText({
            model,
            system,
            messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
          });

          return Response.json({ reply: result.text });
        } catch (e: unknown) {
          const err = e as { statusCode?: number; message?: string };
          const status = err?.statusCode === 429 ? 429 : err?.statusCode === 402 ? 402 : 500;
          console.error("[chat] error", e);
          return Response.json(
            { error: err?.message ?? "Chat failed" },
            { status },
          );
        }
      },
    },
  },
});
