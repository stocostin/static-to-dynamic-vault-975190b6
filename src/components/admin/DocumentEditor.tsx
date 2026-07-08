import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Download, Save, FileDown } from "lucide-react";
import { toast } from "sonner";
import { renderDocumentPdf, downloadPdf, type DocumentData, type LineItem, type BrandSettings } from "@/lib/pdf/renderDocument";

type DocType = "invoice" | "quotation" | "receipt" | "estimate";
type DocStatus = "draft" | "issued" | "paid" | "void";

const TYPE_LABELS: Record<DocType, string> = {
  invoice: "Invoice",
  quotation: "Quotation",
  receipt: "Receipt",
  estimate: "Estimate",
};

const emptyItem = (): LineItem => ({ description: "", size: "", unit: "Pcs", qty: 1, rate_cents: 0 });

type FormState = {
  doc_type: DocType;
  doc_number: string | null;
  status: DocStatus;
  issue_date: string;
  due_date: string;
  client_name: string;
  client_reg_no: string;
  client_kra_pin: string;
  client_address: string;
  client_email: string;
  client_phone: string;
  project_name: string;
  location: string;
  line_items: LineItem[];
  currency: string;
  notes: string;
  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
};

function defaultState(type: DocType): FormState {
  return {
    doc_type: type,
    doc_number: null,
    status: "draft",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    client_name: "",
    client_reg_no: "",
    client_kra_pin: "",
    client_address: "",
    client_email: "",
    client_phone: "",
    project_name: "",
    location: "",
    line_items: [emptyItem()],
    currency: "KES",
    notes: "",
    tax_enabled: false,
    tax_rate: 16,
    tax_label: "VAT",
  };
}

function readSetting(rows: { key: string; value: unknown }[] | undefined, key: string): string {
  const row = rows?.find((r) => r.key === key);
  if (!row) return "";
  const v = row.value;
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

export function DocumentEditor({ id, initialType }: { id?: string; initialType?: DocType }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data as { key: string; value: unknown }[];
    },
  });

  const docQuery = useQuery({
    queryKey: ["business_document", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_documents")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<FormState>(() => defaultState(initialType || "quotation"));
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);

  // Load defaults from settings on first load (create only)
  useEffect(() => {
    if (id || defaultsLoaded || !settingsQuery.data) return;
    const s = settingsQuery.data;
    setForm((f) => ({
      ...f,
      notes: readSetting(s, "document_notes_default") || f.notes,
      tax_enabled: readSetting(s, "tax_enabled") === "true",
      tax_rate: parseFloat(readSetting(s, "tax_rate") || "16") || 16,
      tax_label: readSetting(s, "tax_label") || "VAT",
    }));
    setDefaultsLoaded(true);
  }, [id, defaultsLoaded, settingsQuery.data]);

  // Load existing doc
  useEffect(() => {
    if (!id || !docQuery.data || loadedDocId === id) return;
    const d = docQuery.data;
    setForm({
      doc_type: d.doc_type as DocType,
      doc_number: d.doc_number,
      status: d.status as DocStatus,
      issue_date: d.issue_date,
      due_date: d.due_date || "",
      client_name: d.client_name || "",
      client_reg_no: d.client_reg_no || "",
      client_kra_pin: d.client_kra_pin || "",
      client_address: d.client_address || "",
      client_email: d.client_email || "",
      client_phone: d.client_phone || "",
      project_name: d.project_name || "",
      location: d.location || "",
      line_items: (Array.isArray(d.line_items) ? (d.line_items as unknown as LineItem[]) : [emptyItem()]),
      currency: d.currency || "KES",
      notes: d.notes || "",
      tax_enabled: d.tax_enabled,
      tax_rate: Number(d.tax_rate) || 0,
      tax_label: d.tax_label || "VAT",
    });
    setLoadedDocId(id);
  }, [docQuery.data, id, loadedDocId]);

  const totals = useMemo(() => {
    const subtotal = form.line_items.reduce(
      (acc, it) => acc + Math.round((Number(it.qty) || 0) * (Number(it.rate_cents) || 0)),
      0,
    );
    const tax = form.tax_enabled ? Math.round((subtotal * Number(form.tax_rate)) / 100) : 0;
    return { subtotal, tax, total: subtotal + tax };
  }, [form.line_items, form.tax_enabled, form.tax_rate]);

  const brandSettings = useMemo<BrandSettings>(() => {
    const s = settingsQuery.data;
    return {
      site_name: readSetting(s, "site_name") || "Shachavir Timber Limited",
      logo_url: readSetting(s, "header_logo_url") || null,
      contact_phone: readSetting(s, "contact_phone"),
      contact_email: readSetting(s, "contact_email"),
      contact_address: readSetting(s, "contact_address"),
      website_url: typeof window !== "undefined" ? window.location.host : "",
      document_footer_tagline: readSetting(s, "document_footer_tagline"),
      document_prepared_by: readSetting(s, "document_prepared_by"),
      document_bank_details: readSetting(s, "document_bank_details"),
    };
  }, [settingsQuery.data]);

  const buildRow = (docNumber: string | null, status: DocStatus) => ({
    doc_type: form.doc_type,
    doc_number: docNumber,
    status,
    issue_date: form.issue_date,
    due_date: form.due_date || null,
    client_name: form.client_name,
    client_reg_no: form.client_reg_no || null,
    client_kra_pin: form.client_kra_pin || null,
    client_address: form.client_address || null,
    client_email: form.client_email || null,
    client_phone: form.client_phone || null,
    project_name: form.project_name || null,
    location: form.location || null,
    line_items: form.line_items as unknown as never,
    currency: form.currency,
    subtotal_cents: totals.subtotal,
    tax_enabled: form.tax_enabled,
    tax_rate: form.tax_rate,
    tax_label: form.tax_label,
    tax_cents: totals.tax,
    total_cents: totals.total,
    notes: form.notes || null,
  });

  const save = useMutation({
    mutationFn: async (opts: { issue: boolean }) => {
      if (!form.client_name.trim()) throw new Error("Client name is required.");
      if (!form.line_items.some((it) => it.description.trim())) {
        throw new Error("Add at least one line item with a description.");
      }
      const willIssue = opts.issue;
      let number = form.doc_number;
      const newStatus: DocStatus = willIssue && !number ? "issued" : form.status;
      if (willIssue && !number) {
        const { data, error } = await supabase.rpc("next_document_number", {
          _type: form.doc_type,
        });
        if (error) throw error;
        const seq = String(data).padStart(5, "0");
        const prefix = form.doc_type === "invoice" ? "INV" : form.doc_type === "quotation" ? "QUO" : form.doc_type === "receipt" ? "REC" : "EST";
        number = `${prefix}-${seq}`;
      }
      const row = buildRow(number, newStatus);
      if (id) {
        const { error } = await supabase.from("business_documents").update(row).eq("id", id);
        if (error) throw error;
        return { id };
      } else {
        const { data, error } = await supabase
          .from("business_documents")
          .insert(row)
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id };
      }
    },
    onSuccess: ({ id: newId }, vars) => {
      toast.success(vars.issue ? "Issued and saved." : "Draft saved.");
      qc.invalidateQueries({ queryKey: ["business_documents"] });
      qc.invalidateQueries({ queryKey: ["business_document", newId] });
      if (!id) navigate({ to: "/admin/documents/$id", params: { id: newId } });
    },
    onError: (e: Error) => {
      console.error("[documents] save failed", e);
      toast.error(e.message || "Save failed");
    },
  });

  const [downloading, setDownloading] = useState(false);
  async function handleDownload() {
    setDownloading(true);
    try {
      const data: DocumentData = {
        ...form,
        due_date: form.due_date || null,
        subtotal_cents: totals.subtotal,
        tax_cents: totals.tax,
        total_cents: totals.total,
      };
      const bytes = await renderDocumentPdf(data, brandSettings);
      const client = form.client_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "client";
      const num = form.doc_number || "DRAFT";
      downloadPdf(bytes, `${num}-${client}.pdf`);
    } catch (e) {
      console.error("[documents] pdf failed", e);
      toast.error(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setDownloading(false);
    }
  }

  const setItem = (i: number, patch: Partial<LineItem>) => {
    setForm((f) => ({
      ...f,
      line_items: f.line_items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));
  };

  if (id && docQuery.isLoading) {
    return (
      <div className="p-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {id ? "Edit" : "New"} {TYPE_LABELS[form.doc_type].toLowerCase()}
          </h1>
          {form.doc_number && (
            <p className="text-sm text-muted-foreground mt-1">
              {form.doc_number} · <span className="capitalize">{form.status}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save.mutate({ issue: false })} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save draft
          </Button>
          <Button onClick={() => save.mutate({ issue: true })} disabled={save.isPending}>
            <FileDown className="h-4 w-4 mr-2" /> {form.doc_number ? "Save changes" : "Issue"}
          </Button>
          <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.doc_type}
              onValueChange={(v) => setForm({ ...form, doc_type: v as DocType })}
              disabled={!!form.doc_number}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as DocType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DocStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "issued", "paid", "void"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Issue date</Label>
            <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Due date (optional)</Label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Client name *</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Registration no</Label><Input value={form.client_reg_no} onChange={(e) => setForm({ ...form, client_reg_no: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>KRA PIN</Label><Input value={form.client_kra_pin} onChange={(e) => setForm({ ...form, client_kra_pin: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Project</Label><Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Address</Label><Input value={form.client_address} onChange={(e) => setForm({ ...form, client_address: e.target.value })} /></div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Line items</h2>
          <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, line_items: [...f.line_items, emptyItem()] }))}>
            <Plus className="h-4 w-4 mr-1" /> Add row
          </Button>
        </div>
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-[1fr_120px_80px_70px_110px_120px_40px] gap-2 text-xs text-muted-foreground px-1">
            <span>Description</span><span>Size</span><span>Unit</span><span>Qty</span><span>Rate</span><span className="text-right">Amount</span><span></span>
          </div>
          {form.line_items.map((it, i) => {
            const amt = (Number(it.qty) || 0) * (Number(it.rate_cents) || 0);
            return (
              <div key={i} className="grid grid-cols-2 md:grid-cols-[1fr_120px_80px_70px_110px_120px_40px] gap-2">
                <Input placeholder="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                <Input placeholder="Size" value={it.size || ""} onChange={(e) => setItem(i, { size: e.target.value })} />
                <Input placeholder="Unit" value={it.unit || ""} onChange={(e) => setItem(i, { unit: e.target.value })} />
                <Input type="number" min={0} value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} />
                <Input type="number" min={0} step={0.01} placeholder="Rate" value={it.rate_cents ? it.rate_cents / 100 : ""} onChange={(e) => setItem(i, { rate_cents: Math.round(Number(e.target.value) * 100) })} />
                <div className="text-right self-center text-sm tabular-nums pr-2">{(amt / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <Button size="icon" variant="ghost" onClick={() => setForm((f) => ({ ...f, line_items: f.line_items.filter((_, idx) => idx !== i) }))} disabled={form.line_items.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tax</h2>
            <div className="flex items-center gap-3">
              <Switch checked={form.tax_enabled} onCheckedChange={(v) => setForm({ ...form, tax_enabled: v })} />
              <Label>Apply tax on this document</Label>
            </div>
            {form.tax_enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Label</Label><Input value={form.tax_label} onChange={(e) => setForm({ ...form, tax_label: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Rate %</Label><Input type="number" step={0.1} value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} /></div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Default is controlled globally in Site settings → Documents.</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Totals</h2>
            <div className="rounded-md border p-3 text-sm space-y-1.5">
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{(totals.subtotal / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {form.currency}</span></div>
              {form.tax_enabled && (
                <div className="flex justify-between text-muted-foreground"><span>{form.tax_label} ({form.tax_rate}%)</span><span className="tabular-nums">{(totals.tax / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              )}
              <div className="flex justify-between font-semibold text-base border-t pt-2"><span>Total</span><span className="tabular-nums">{(totals.total / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {form.currency}</span></div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-2">
        <Label>Notes</Label>
        <Textarea rows={6} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <p className="text-xs text-muted-foreground">Shown at the bottom of the PDF. One bullet per line.</p>
      </Card>
    </div>
  );
}
