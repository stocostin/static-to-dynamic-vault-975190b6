import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_shop_products",
  title: "List shop products",
  description: "List published shop products with optional search query.",
  inputSchema: {
    query: z.string().optional().describe("Optional search term matched against product title."),
    limit: z.number().int().min(1).max(100).optional().describe("Max products to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase
      .from("shop_products")
      .select("title, slug, price_cents, currency, category, description, in_stock")
      .eq("is_published", true)
      .limit(limit ?? 25);
    if (query && query.trim()) q = q.ilike("title", `%${query.trim()}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
