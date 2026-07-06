import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_portfolio",
  title: "List portfolio projects",
  description: "List published portfolio projects, optionally filtered by category.",
  inputSchema: {
    category: z.string().optional().describe("Optional category slug to filter by."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase
      .from("portfolio_projects")
      .select("title, slug, category, description, location, completed_at, is_published")
      .eq("is_published", true)
      .limit(limit ?? 25);
    if (category && category.trim()) q = q.eq("category", category.trim());
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
