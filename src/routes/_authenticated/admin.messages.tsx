import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source_page: string | null;
  is_read: boolean;
  created_at: string;
};

function MessagesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Message | null>(null);

  const q = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact_messages"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact_messages"] });
      toast.success("Deleted");
      setSelected(null);
    },
  });

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">Contact messages</h1>
      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((m) => (
            <Card
              key={m.id}
              className={`p-4 cursor-pointer hover:bg-muted/40 ${!m.is_read ? "border-primary" : ""}`}
              onClick={() => {
                setSelected(m);
                if (!m.is_read) markRead.mutate(m.id);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-sm text-muted-foreground">{m.email}</span>
                    {!m.is_read && <Badge>New</Badge>}
                  </div>
                  <div className="text-sm mt-1 truncate">
                    {m.subject ? <strong>{m.subject}: </strong> : null}
                    {m.message}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
          {(q.data ?? []).length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No messages yet.
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject || "Message"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><strong>From:</strong> {selected.name} &lt;{selected.email}&gt;</div>
              {selected.phone && <div><strong>Phone:</strong> {selected.phone}</div>}
              {selected.source_page && <div><strong>Page:</strong> {selected.source_page}</div>}
              <div className="whitespace-pre-wrap border-t pt-3">{selected.message}</div>
              <div className="flex gap-2 pt-3">
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${selected.email}`}>
                    <Mail className="h-4 w-4 mr-2" /> Reply
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this message?")) del.mutate(selected.id);
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
