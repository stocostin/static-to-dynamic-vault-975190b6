import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type FieldSpec =
  | { key: string; label: string; type: "text" | "textarea" | "longtext" | "image" | "url"; placeholder?: string; help?: string }
  | {
      key: string;
      label: string;
      type: "repeater";
      itemLabel?: string;
      itemFields: { key: string; label: string; type: "text" | "textarea" }[];
      help?: string;
    };

export interface SectionSpec {
  key: string;              // section_key in DB
  title: string;            // display label in the editor
  description?: string;
  fields: FieldSpec[];
}

export interface PageEditorSpec {
  pageSlug: string;
  pageTitle: string;
  liveUrl: string;
  intro?: string;
  sections: SectionSpec[];
}

type Row = {
  id: string;
  section_key: string;
  content: Record<string, unknown> | null;
};

export function PageEditor({ spec }: { spec: PageEditorSpec }) {
  const qc = useQueryClient();

  const pageQ = useQuery({
    queryKey: ["page", spec.pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id,slug,title,seo_title,meta_description,og_image_url")
        .eq("slug", spec.pageSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const rowsQ = useQuery({
    queryKey: ["page_sections", "editor", spec.pageSlug],
    enabled: !!pageQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("id,section_key,content")
        .eq("page_id", pageQ.data!.id);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const byKey = useMemo(() => {
    const m = new Map<string, Row>();
    for (const r of rowsQ.data ?? []) m.set(r.section_key, r);
    return m;
  }, [rowsQ.data]);

  // form state: map section_key -> content object
  const [state, setState] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (!rowsQ.data) return;
    const next: Record<string, Record<string, unknown>> = {};
    for (const s of spec.sections) {
      const row = byKey.get(s.key);
      next[s.key] = { ...(row?.content ?? {}) };
    }
    setState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsQ.data]);

  const save = useMutation({
    mutationFn: async (sectionKey: string) => {
      if (!pageQ.data) throw new Error("Page not found");
      const content = (state[sectionKey] ?? {}) as unknown as Json;
      const existing = byKey.get(sectionKey);
      if (existing) {
        const { error } = await supabase
          .from("page_sections")
          .update({ content, is_visible: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("page_sections").insert({
          page_id: pageQ.data.id,
          section_key: sectionKey,
          content,
          is_visible: true,
          sort_order: 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page_sections"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImage = async (sectionKey: string, fieldKey: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `pages/${spec.pageSlug}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload(path, file);
    if (error) { toast.error(error.message); return; }
    setSectionField(sectionKey, fieldKey, `/uploads/${path}`);
  };

  const setSectionField = (sectionKey: string, fieldKey: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), [fieldKey]: value },
    }));
  };

  if (pageQ.isLoading || rowsQ.isLoading) {
    return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!pageQ.data) {
    return <div className="p-6 text-destructive">Page not found: {spec.pageSlug}</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{spec.pageTitle}</h1>
          {spec.intro && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{spec.intro}</p>}
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={spec.liveUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open live page
          </a>
        </Button>
      </div>

      {spec.sections.map((s) => {
        const content = state[s.key] ?? {};
        return (
          <Card key={s.key} className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{s.title}</h2>
              {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
            </div>
            <Separator />
            <div className="space-y-4">
              {s.fields.map((f) => renderField(f, content, s.key, setSectionField, uploadImage))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => save.mutate(s.key)} disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save "{s.title}"
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function renderField(
  f: FieldSpec,
  content: Record<string, unknown>,
  sectionKey: string,
  setF: (sk: string, fk: string, v: unknown) => void,
  upload: (sk: string, fk: string, file: File) => void,
) {
  const v = content[f.key];

  if (f.type === "repeater") {
    const items = Array.isArray(v) ? (v as Record<string, string>[]) : [];
    const update = (next: Record<string, string>[]) => setF(sectionKey, f.key, next);
    return (
      <div key={f.key} className="space-y-2">
        <Label>{f.label}</Label>
        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {f.itemLabel ?? "Item"} #{i + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => update(items.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {f.itemFields.map((iF) => (
                <div key={iF.key} className="space-y-1">
                  <Label className="text-xs">{iF.label}</Label>
                  {iF.type === "textarea" ? (
                    <Textarea
                      rows={2}
                      value={it[iF.key] ?? ""}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = { ...next[i], [iF.key]: e.target.value };
                        update(next);
                      }}
                    />
                  ) : (
                    <Input
                      value={it[iF.key] ?? ""}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = { ...next[i], [iF.key]: e.target.value };
                        update(next);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update([...items, {}])}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add {f.itemLabel ?? "item"}
          </Button>
        </div>
      </div>
    );
  }

  const strVal = typeof v === "string" ? v : "";

  if (f.type === "textarea" || f.type === "longtext") {
    return (
      <div key={f.key} className="space-y-1.5">
        <Label>{f.label}</Label>
        <Textarea
          rows={f.type === "longtext" ? 8 : 3}
          value={strVal}
          placeholder={f.placeholder}
          onChange={(e) => setF(sectionKey, f.key, e.target.value)}
        />
        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
      </div>
    );
  }

  if (f.type === "image") {
    return (
      <div key={f.key} className="space-y-1.5">
        <Label>{f.label}</Label>
        <Input
          value={strVal}
          placeholder="https://... or upload below"
          onChange={(e) => setF(sectionKey, f.key, e.target.value)}
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(sectionKey, f.key, file); }}
        />
        {strVal && <img src={strVal} alt="" className="h-24 rounded border object-cover" />}
        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
      </div>
    );
  }

  return (
    <div key={f.key} className="space-y-1.5">
      <Label>{f.label}</Label>
      <Input
        value={strVal}
        placeholder={f.placeholder}
        onChange={(e) => setF(sectionKey, f.key, e.target.value)}
      />
      {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
    </div>
  );
}
