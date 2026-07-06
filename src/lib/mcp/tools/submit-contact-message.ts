import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "submit_contact_message",
  title: "Submit contact message",
  description: "Send a contact/inquiry message to Shachavir Timber.",
  inputSchema: {
    name: z.string().min(1).describe("Sender's full name."),
    email: z.string().email().describe("Sender's email address."),
    phone: z.string().optional().describe("Optional phone number."),
    subject: z.string().optional(),
    message: z.string().min(1).describe("Message body."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, email, phone, subject, message }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("messages").insert({
      name,
      email,
      phone: phone ?? null,
      subject: subject ?? null,
      message,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: "Message submitted successfully." }] };
  },
});
