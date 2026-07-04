import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/blog-posts/$id")({
  component: BlogPostEditor,
});

function BlogPostEditor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["blog_posts", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", cover_image_url: "", body_html: "",
    category: "", author: "", tags: "",
    seo_title: "", meta_description: "",
    is_published: false, published_at: "",
  });

  useEffect(() => {
    if (!q.data) return;
    const d = q.data;
    setForm({
      title: d.title ?? "",
      slug: d.slug ?? "",
      excerpt: d.excerpt ?? "",
      cover_image_url: d.cover_image_url ?? "",
      body_html: d.body_html ?? "",
      category: d.category ?? "",
      author: d.author ?? "",
      tags: Array.isArray(d.tags) ? (d.tags as string[]).join(", ") : "",
      seo_title: d.seo_title ?? "",
      meta_description: d.meta_description ?? "",
      is_published: !!d.is_published,
      published_at: d.published_at ? d.published_at.slice(0, 10) : "",
    });
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt || null,
        cover_image_url: form.cover_image_url || null,
        body_html: form.body_html,
        category: form.category || null,
        author: form.author || null,
        tags,
        seo_title: form.seo_title || null,
        meta_description: form.meta_description || null,
        is_published: form.is_published,
        published_at: form.published_at
          ? new Date(form.published_at).toISOString()
          : form.is_published ? new Date().toISOString() : null,
      };
      if (!payload.title) throw new Error("Title required");
      if (!payload.slug) throw new Error("Slug required");
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog_posts"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadCover = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `blog/cover-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("admin-uploads").getPublicUrl(path);
    setForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
  };

  if (q.isLoading) return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (q.error) return <div className="p-6 text-destructive">{(q.error as Error).message}</div>;

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/blog-posts"><ArrowLeft className="h-4 w-4 mr-1" /> All posts</Link>
          </Button>
          <h1 className="text-xl font-semibold">Edit post</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/blog`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />View blog</a>
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt (shown in list preview)</Label>
              <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <Label>Article body</Label>
            <RichTextEditor
              value={form.body_html}
              onChange={(v) => setForm((f) => ({ ...f, body_html: v }))}
              placeholder="Start writing your article…"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label className="!m-0">Published</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Publish date</Label>
              <Input type="date" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <Label>Cover image</Label>
            <Input
              value={form.cover_image_url}
              placeholder="https://... or upload"
              onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
            />
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
            {form.cover_image_url && <img src={form.cover_image_url} alt="" className="w-full rounded border object-cover" />}
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-medium">SEO</h3>
            <div className="space-y-1.5">
              <Label>SEO title</Label>
              <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Meta description</Label>
              <Textarea rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
