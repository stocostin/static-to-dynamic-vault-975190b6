import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_services",
  title: "List services",
  description: "List published services offered by Shachavir Timber.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max number of services to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("services")
      .select("title, slug, short_description, price, is_published")
      .eq("is_published", true)
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { services: data ?? [] },
    };
  },
});
