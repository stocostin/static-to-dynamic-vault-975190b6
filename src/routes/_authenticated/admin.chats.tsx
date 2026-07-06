import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/chats")({
  component: ChatsPage,
});

type Conversation = {
  id: string;
  session_id: string;
  first_message: string | null;
  last_message: string | null;
  message_count: number;
  source_page: string | null;
  user_agent: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function ChatsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Conversation | null>(null);

  const list = useQuery({
    queryKey: ["chat_conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
  });

  const transcript = useQuery({
    queryKey: ["chat_messages", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", selected!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMsg[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_conversations"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_conversations"] });
      toast.success("Conversation deleted");
      setSelected(null);
    },
  });

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Chat inquiries</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Conversations from the Shachavir Assistant chat widget. Click a row to view the full
        transcript.
      </p>

      {list.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <div className="space-y-2">
          {(list.data ?? []).map((c) => (
            <Card
              key={c.id}
              className={`p-4 cursor-pointer hover:bg-muted/40 ${!c.is_read ? "border-primary" : ""}`}
              onClick={() => {
                setSelected(c);
                if (!c.is_read) markRead.mutate(c.id);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {c.source_page ? `Chat from ${c.source_page}` : "Chat"}
                    </span>
                    <Badge variant="secondary">{c.message_count} msgs</Badge>
                    {!c.is_read && <Badge>New</Badge>}
                  </div>
                  <div className="text-sm mt-1 truncate text-muted-foreground">
                    {c.last_message || c.first_message || "(no message yet)"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(c.updated_at).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
          {(list.data ?? []).length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No chat inquiries yet.
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat transcript</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <strong>Started:</strong>{" "}
                  {new Date(selected.created_at).toLocaleString()}
                </div>
                <div>
                  <strong>Last activity:</strong>{" "}
                  {new Date(selected.updated_at).toLocaleString()}
                </div>
                {selected.source_page && (
                  <div className="col-span-2">
                    <strong>Page:</strong> {selected.source_page}
                  </div>
                )}
                {selected.user_agent && (
                  <div className="col-span-2 truncate" title={selected.user_agent}>
                    <strong>Device:</strong> {selected.user_agent}
                  </div>
                )}
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-2 border rounded-md bg-muted/30 p-3">
                {transcript.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {(transcript.data ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 whitespace-pre-wrap"
                          : "max-w-[80%] rounded-2xl rounded-bl-sm bg-background border px-3 py-2 whitespace-pre-wrap"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {transcript.data && transcript.data.length === 0 && !transcript.isLoading && (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    No messages captured for this conversation.
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this conversation and all its messages?")) {
                      del.mutate(selected.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
