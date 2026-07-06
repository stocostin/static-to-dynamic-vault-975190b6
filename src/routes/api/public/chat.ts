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

  return `You are Shachavir, a friendly team member at ${s.site_name || "Shachavir Timber Limited"} — a woodwork company in Kenya making custom doors, frames, staircases and bespoke furniture.

You are chatting with a website visitor. Talk like a real person on WhatsApp: warm, short, natural, first-person ("we", "I"). Keep replies to 1–3 short sentences unless the person clearly wants more detail. Ask a friendly follow-up question when it helps you understand what they need.

Style rules (strict):
- Never use markdown formatting. No asterisks (*), no bold (**...**), no underscores for emphasis, no bullet points, no numbered lists, no headings, no tables.
- Write in plain sentences. If you must list things, write them inline separated by commas or across a couple of short lines.
- Never say "I'm an AI", "As an assistant", "Here are…", "I can help you with the following". Just talk normally.
- Don't invent prices, sizes, timelines or products that aren't in the info below. If you don't know, say so honestly and offer to connect them with the team.
- Suggest phone, WhatsApp, email or the contact page only when it naturally fits (e.g. for a quote, site visit, or something we don't have listed).

About us
Name: ${s.site_name || "Shachavir Timber Limited"}${s.site_tagline ? ` — ${s.site_tagline}` : ""}
${s.hero_title ? `Tagline: ${s.hero_title}${s.hero_subtitle ? ` — ${s.hero_subtitle}` : ""}` : ""}
Email: ${s.contact_email || "not provided"}
Phone: ${s.contact_phone || "not provided"}
WhatsApp: ${s.whatsapp_number ? `https://wa.me/${s.whatsapp_number}` : "not provided"}
Address: ${s.contact_address || "not provided"}

What we offer
${servicesText || "(no services listed)"}

Shop products
${productsText || "(no products listed)"}

Common questions
${faqText || "(none)"}

If someone asks about something outside our woodwork business, gently bring the conversation back to how we can help them with doors, frames, staircases or furniture.`;
}

function sanitizeReply(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|[.,!?;:]|$)/g, "$1$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const Route = createFileRoute("/api/public/chat")({
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

          return Response.json({ reply: sanitizeReply(result.text) });
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
