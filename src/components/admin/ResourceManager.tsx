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
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export type FieldType =
  | "text"
  | "textarea"
  | "longtext"
  | "number"
  | "boolean"
  | "slug"
  | "image"
  | "images"
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
      return null;
    }
    const url = `/uploads/${path}`;
    setForm((f) => ({ ...f, [key]: url }));
    return url;
  };

  const uploadImages = async (files: FileList, key: string) => {
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${table}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("admin-uploads").upload(path, file);
      if (error) {
        toast.error(error.message);
        continue;
      }
      uploaded.push(`/uploads/${path}`);
    }
    if (uploaded.length) {
      setForm((f) => {
        const cur = Array.isArray(f[key]) ? (f[key] as string[]) : [];
        return { ...f, [key]: [...cur, ...uploaded] };
      });
    }
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
      else if (f.type === "images") {
        payload[f.key] = Array.isArray(v) ? v.filter(Boolean) : [];
      }
      else if (f.type === "stringlist") {
        if (Array.isArray(v)) payload[f.key] = v;
        else if (typeof v === "string") {
          payload[f.key] = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        } else payload[f.key] = [];
      }
      else payload[f.key] = v ?? null;
    }
    saveMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto">
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
          <div className="w-full overflow-x-auto">
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
                    <TableCell key={c.key} className="max-w-xs">
                      {renderCell(row[c.key], c.key)}
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
          </div>
        )}

      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
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
                ) : f.type === "images" ? (
                  <div className="space-y-2">
                    {Array.isArray(form[f.key]) && (form[f.key] as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(form[f.key] as string[]).map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url}
                              alt=""
                              className="h-20 w-20 rounded border object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 flex justify-between p-0.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="text-white text-xs px-1"
                                onClick={() => {
                                  const arr = [...(form[f.key] as string[])];
                                  if (idx > 0) { [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setForm({ ...form, [f.key]: arr }); }
                                }}
                              >←</button>
                              <button
                                type="button"
                                className="text-white text-xs px-1"
                                onClick={() => {
                                  const arr = (form[f.key] as string[]).filter((_, i) => i !== idx);
                                  setForm({ ...form, [f.key]: arr });
                                }}
                              >×</button>
                              <button
                                type="button"
                                className="text-white text-xs px-1"
                                onClick={() => {
                                  const arr = [...(form[f.key] as string[])];
                                  if (idx < arr.length - 1) { [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; setForm({ ...form, [f.key]: arr }); }
                                }}
                              >→</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length) uploadImages(files, f.key);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste image URL and press Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const url = (e.target as HTMLInputElement).value.trim();
                            if (url) {
                              const cur = Array.isArray(form[f.key]) ? (form[f.key] as string[]) : [];
                              setForm({ ...form, [f.key]: [...cur, url] });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : f.type === "stringlist" ? (
                  <Textarea
                    rows={5}
                    value={
                      Array.isArray(form[f.key])
                        ? (form[f.key] as string[]).join("\n")
                        : (form[f.key] ?? "")
                    }
                    placeholder={f.placeholder ?? "One item per line"}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : f.type === "richtext" ? (
                  <RichTextEditor
                    value={form[f.key] ?? ""}
                    onChange={(v: string) => setForm({ ...form, [f.key]: v })}
                  />
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
