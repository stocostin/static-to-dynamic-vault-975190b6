import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/page-sections")({
  component: PageSectionsPage,
});

type Row = {
  id: string;
  page_id: string;
  section_key: string;
  is_visible: boolean;
  sort_order: number;
  content: Record<string, unknown> | null;
};

type PageOpt = { id: string; slug: string; title: string };

const EMPTY_CONTENT = { selector: "", title: "", body: "", image_url: "", html: "" };

function PageSectionsPage() {
  const qc = useQueryClient();
  const [pageId, setPageId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<{
    section_key: string;
    sort_order: number;
    is_visible: boolean;
    content: typeof EMPTY_CONTENT;
  }>({ section_key: "", sort_order: 0, is_visible: true, content: { ...EMPTY_CONTENT } });

  const pagesQ = useQuery({
    queryKey: ["pages", "list-for-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id,slug,title")
        .order("slug", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PageOpt[];
    },
  });

  useEffect(() => {
    if (!pageId && pagesQ.data && pagesQ.data.length) setPageId(pagesQ.data[0].id);
  }, [pagesQ.data, pageId]);

  const listQ = useQuery({
    queryKey: ["page_sections", "for", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const activePage = useMemo(
    () => pagesQ.data?.find((p) => p.id === pageId),
    [pagesQ.data, pageId],
  );

  const save = useMutation({
    mutationFn: async () => {
      const content: Record<string, unknown> = {};
      for (const k of Object.keys(form.content) as (keyof typeof EMPTY_CONTENT)[]) {
        const v = form.content[k];
        if (v !== "" && v != null) content[k] = v;
      }
      const payload = {
        page_id: pageId,
        section_key: form.section_key.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_visible: form.is_visible,
        content,
      };
      if (!payload.section_key) throw new Error("Section key is required");
      if (editing) {
        const { error } = await supabase
          .from("page_sections")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("page_sections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page_sections"] });
      setOpen(false);
      setEditing(null);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("page_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page_sections"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ section_key: "", sort_order: 0, is_visible: true, content: { ...EMPTY_CONTENT } });
    setOpen(true);
  };
  const openEdit = (row: Row) => {
    setEditing(row);
    const c = (row.content ?? {}) as Partial<typeof EMPTY_CONTENT>;
    setForm({
      section_key: row.section_key,
      sort_order: row.sort_order,
      is_visible: row.is_visible,
      content: {
        selector: (c.selector as string) ?? "",
        title: (c.title as string) ?? "",
        body: (c.body as string) ?? "",
        image_url: (c.image_url as string) ?? "",
        html: (c.html as string) ?? "",
      },
    });
    setOpen(true);
  };

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Page sections</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Override any block of copy or image on the public site without editing HTML.
            Choose a page, add a section, and target the block with a CSS selector.
            Provide any of: title (replaces the first heading), body (replaces the first
            paragraph), image URL, or full HTML.
          </p>
        </div>
        <div className="flex gap-2">
          {activePage && (
            <Button asChild variant="outline" size="sm">
              <a
                href={activePage.slug === "home" ? "/" : `/${activePage.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Open live page
              </a>
            </Button>
          )}
          <Button onClick={openCreate} disabled={!pageId}>
            <Plus className="h-4 w-4 mr-2" /> New section
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Page</Label>
        <Select value={pageId} onValueChange={setPageId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choose a page" />
          </SelectTrigger>
          <SelectContent>
            {(pagesQ.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title} ({p.slug})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {listQ.isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (listQ.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No sections yet for this page.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section key</TableHead>
                <TableHead>Selector</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.data!.map((row) => {
                const c = (row.content ?? {}) as Record<string, string>;
                const preview = c.title || c.body || c.html || c.image_url || "";
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.section_key}</TableCell>
                    <TableCell className="font-mono text-xs">{c.selector || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{preview.slice(0, 80)}</TableCell>
                    <TableCell>{row.sort_order}</TableCell>
                    <TableCell>{row.is_visible ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (confirm("Delete this section?")) del.mutate(row.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit section" : "New section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Section key</Label>
                <Input
                  placeholder="e.g. hero_note"
                  value={form.section_key}
                  onChange={(e) => setForm({ ...form, section_key: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_visible}
                onCheckedChange={(v) => setForm({ ...form, is_visible: v })}
              />
              <Label>Visible on site</Label>
            </div>

            <div className="space-y-1.5">
              <Label>CSS selector (required)</Label>
              <Input
                placeholder='e.g. section.why-choose-us h2'
                value={form.content.selector}
                onChange={(e) =>
                  setForm({ ...form, content: { ...form.content, selector: e.target.value } })
                }
              />
              <p className="text-xs text-muted-foreground">
                Which element on the live page to change. Right-click → Inspect on the site to find it.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Title (replaces first h1/h2/h3 inside the selector)</Label>
              <Input
                value={form.content.title}
                onChange={(e) =>
                  setForm({ ...form, content: { ...form.content, title: e.target.value } })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Body text (replaces first paragraph)</Label>
              <Textarea
                rows={3}
                value={form.content.body}
                onChange={(e) =>
                  setForm({ ...form, content: { ...form.content, body: e.target.value } })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image URL (replaces first image)</Label>
              <Input
                value={form.content.image_url}
                onChange={(e) =>
                  setForm({ ...form, content: { ...form.content, image_url: e.target.value } })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Raw HTML (advanced — replaces entire selector's inner HTML)</Label>
              <Textarea
                rows={6}
                className="font-mono text-xs"
                value={form.content.html}
                onChange={(e) =>
                  setForm({ ...form, content: { ...form.content, html: e.target.value } })
                }
              />
              <p className="text-xs text-muted-foreground">
                If set, this overrides Title / Body / Image above.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
