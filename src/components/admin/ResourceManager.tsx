import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type FieldType =
  | "text"
  | "textarea"
  | "longtext"
  | "number"
  | "boolean"
  | "slug"
  | "image"
  | "url"
  | "stringlist"
  | "richtext";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
}

interface Props {
  title: string;
  description?: string;
  table: string;
  fields: FieldDef[];
  listColumns: { key: string; label: string }[];
  orderBy?: { column: string; ascending?: boolean };
  defaultValues?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export function ResourceManager({
  title,
  description,
  table,
  fields,
  listColumns,
  orderBy = { column: "sort_order", ascending: true },
  defaultValues = {},
}: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});

  const listQuery = useQuery({
    queryKey: [table, "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .select("*")
        .order(orderBy.column, { ascending: orderBy.ascending ?? true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Row) => {
      if (editing?.id) {
        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(table as any)
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from(table as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      setOpen(false);
      setEditing(null);
      toast.success(editing ? "Updated" : "Created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultValues });
    setOpen(true);
  };
  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({ ...row });
    setOpen(true);
  };

  const uploadImage = async (file: File, key: string) => {
    const ext = file.name.split(".").pop();
    const path = `${table}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("admin-uploads").getPublicUrl(path);
    setForm((f) => ({ ...f, [key]: data.publicUrl }));
  };

  const submit = () => {
    const payload: Row = {};
    for (const f of fields) {
      const v = form[f.key];
      if (f.required && (v === undefined || v === null || v === "")) {
        toast.error(`${f.label} is required`);
        return;
      }
      if (f.type === "number") payload[f.key] = v === "" || v == null ? null : Number(v);
      else if (f.type === "boolean") payload[f.key] = !!v;
      else payload[f.key] = v ?? null;
    }
    saveMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New
        </Button>
      </div>

      <Card>
        {listQuery.isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : listQuery.error ? (
          <div className="p-6 text-sm text-destructive">
            {(listQuery.error as Error).message}
          </div>
        ) : (listQuery.data ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No items yet. Click "New" to add one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {listColumns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data!.map((row) => (
                <TableRow key={row.id}>
                  {listColumns.map((c) => (
                    <TableCell key={c.key} className="max-w-xs truncate">
                      {renderCell(row[c.key])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this item?")) deleteMutation.mutate(row.id);
                      }}
                    >
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {f.type === "textarea" || f.type === "longtext" ? (
                  <Textarea
                    rows={f.type === "longtext" ? 8 : 3}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : f.type === "boolean" ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!form[f.key]}
                      onCheckedChange={(v) => setForm({ ...form, [f.key]: v })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form[f.key] ? "Yes" : "No"}
                    </span>
                  </div>
                ) : f.type === "image" ? (
                  <div className="space-y-2">
                    <Input
                      value={form[f.key] ?? ""}
                      placeholder="https://... or upload below"
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, f.key);
                      }}
                    />
                    {form[f.key] && (
                      <img
                        src={form[f.key]}
                        alt=""
                        className="h-24 rounded border object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderCell(v: unknown) {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof v === "boolean")
    return v ? (
      <span className="text-green-600">Yes</span>
    ) : (
      <span className="text-muted-foreground">No</span>
    );
  if (typeof v === "string" && v.startsWith("http") && /\.(png|jpe?g|webp|gif|svg)/i.test(v))
    return <img src={v} alt="" className="h-8 w-8 object-cover rounded" />;
  return String(v);
}
