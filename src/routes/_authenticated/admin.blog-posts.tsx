import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/blog-posts")({
  component: BlogPostsList,
});

function BlogPostsList() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const listQ = useQuery({
    queryKey: ["blog_posts", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug,title,category,is_published,published_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const title = newTitle.trim();
      if (!title) throw new Error("Title required");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({ title, slug: slug || `post-${Date.now()}`, body_html: "", is_published: false })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["blog_posts"] });
      setNewTitle(""); setCreating(false);
      window.location.href = `/admin/blog-posts/${id}`;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["blog_posts"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePub = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ is_published: next, published_at: next ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog_posts"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Blog posts</h1>
          <p className="text-sm text-muted-foreground">Write, edit, and publish articles with the rich-text editor.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><a href="/blog" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Open live blog</a></Button>
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> New post</Button>
        </div>
      </div>

      {creating && (
        <Card className="p-4 space-y-3">
          <Label>Post title</Label>
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Choosing the right wood for your project"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setCreating(false); setNewTitle(""); }}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create & edit
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {listQ.isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (listQ.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No posts yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.data!.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category ?? "—"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!p.is_published}
                      onCheckedChange={(v) => togglePub.mutate({ id: p.id, next: v })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link to="/admin/blog-posts/$id" params={{ id: p.id }}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
