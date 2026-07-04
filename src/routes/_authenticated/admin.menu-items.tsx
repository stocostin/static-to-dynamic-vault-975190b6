import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/menu-items")({
  component: MenuItemsPage,
});

type MenuOpt = { id: string; slug: string; title: string };
type Item = {
  id: string;
  menu_id: string;
  label: string;
  url: string;
  sort_order: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
};

function MenuItemsPage() {
  const qc = useQueryClient();
  const [menuId, setMenuId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({
    label: "",
    url: "",
    sort_order: 0,
    is_visible: true,
    open_in_new_tab: false,
  });

  const menusQ = useQuery({
    queryKey: ["menus", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menus").select("id,slug,title").order("slug");
      if (error) throw error;
      return (data ?? []) as MenuOpt[];
    },
  });

  useEffect(() => {
    if (!menuId && menusQ.data?.length) setMenuId(menusQ.data[0].id);
  }, [menusQ.data, menuId]);

  const itemsQ = useQuery({
    queryKey: ["menu_items", "for", menuId],
    enabled: !!menuId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("menu_id", menuId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const activeMenu = useMemo(
    () => menusQ.data?.find((m) => m.id === menuId),
    [menusQ.data, menuId],
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        menu_id: menuId,
        label: form.label.trim(),
        url: form.url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_visible: form.is_visible,
        open_in_new_tab: form.open_in_new_tab,
      };
      if (!payload.label || !payload.url) throw new Error("Label and URL are required");
      if (editing) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu_items"] });
      setOpen(false);
      setEditing(null);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const item = itemsQ.data?.find((i) => i.id === id);
      if (!item) return;
      const { error } = await supabase
        .from("menu_items")
        .update({ sort_order: Math.max(0, item.sort_order + delta) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });

  const openCreate = () => {
    setEditing(null);
    const next = (itemsQ.data?.reduce((m, i) => Math.max(m, i.sort_order), 0) ?? 0) + 1;
    setForm({ label: "", url: "", sort_order: next, is_visible: true, open_in_new_tab: false });
    setOpen(true);
  };
  const openEdit = (it: Item) => {
    setEditing(it);
    setForm({
      label: it.label,
      url: it.url,
      sort_order: it.sort_order,
      is_visible: it.is_visible,
      open_in_new_tab: it.open_in_new_tab,
    });
    setOpen(true);
  };

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Menu items</h1>
          <p className="text-sm text-muted-foreground">
            Edit navigation menus. "primary" is the header nav, "footer" is the footer
            Quick Links, and "footer_services" is the footer services list.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!menuId}>
          <Plus className="h-4 w-4 mr-2" /> New item
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Menu</Label>
        <Select value={menuId} onValueChange={setMenuId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choose a menu" />
          </SelectTrigger>
          <SelectContent>
            {(menusQ.data ?? []).map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.title} ({m.slug})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeMenu && (
          <span className="text-xs text-muted-foreground">slug: {activeMenu.slug}</span>
        )}
      </div>

      <Card>
        {itemsQ.isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (itemsQ.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No items yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>New tab</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsQ.data!.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="font-mono text-xs">{row.url}</TableCell>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell>{row.open_in_new_tab ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.is_visible ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => move.mutate({ id: row.id, delta: -1 })}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => move.mutate({ id: row.id, delta: 1 })}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(row.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "New item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                placeholder="/about or https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
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
            <div className="flex items-center gap-3">
              <Switch checked={form.is_visible} onCheckedChange={(v) => setForm({ ...form, is_visible: v })} />
              <Label>Visible</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.open_in_new_tab}
                onCheckedChange={(v) => setForm({ ...form, open_in_new_tab: v })}
              />
              <Label>Open in new tab</Label>
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
