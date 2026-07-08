import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DocType = "invoice" | "quotation" | "receipt" | "estimate";

const TYPES: { value: DocType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "invoice", label: "Invoices" },
  { value: "quotation", label: "Quotations" },
  { value: "receipt", label: "Receipts" },
  { value: "estimate", label: "Estimates" },
];

const CREATE_TYPES: { value: DocType; label: string }[] = [
  { value: "invoice", label: "Invoice" },
  { value: "quotation", label: "Quotation" },
  { value: "receipt", label: "Receipt" },
  { value: "estimate", label: "Estimate" },
];

export const Route = createFileRoute("/_authenticated/admin/documents/")({
  component: DocumentsList,
});

function DocumentsList() {
  const [filter, setFilter] = useState<DocType | "all">("all");
  const q = useQuery({
    queryKey: ["business_documents", filter],
    queryFn: async () => {
      let query = supabase
        .from("business_documents")
        .select("id, doc_type, doc_number, status, issue_date, client_name, total_cents, currency")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("doc_type", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">Invoices, quotations, receipts and estimates.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filter} onValueChange={(v) => setFilter(v as DocType | "all")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {CREATE_TYPES.map((t) => (
            <Button key={t.value} asChild variant={t.value === "quotation" ? "default" : "outline"}>
              <Link to="/admin/documents/new" search={{ type: t.value }}>
                <Plus className="h-4 w-4 mr-1" /> {t.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {q.isLoading ? (
          <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">Number</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    No documents yet. Choose a document type above to create one.
                  </td></tr>
                )}
                {q.data?.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-muted/30 cursor-pointer">
                    <td className="px-3 py-2 font-mono">
                      <Link to="/admin/documents/$id" params={{ id: d.id }} className="hover:underline">
                        {d.doc_number || "— draft"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 capitalize">{d.doc_type}</td>
                    <td className="px-3 py-2">{d.client_name || "—"}</td>
                    <td className="px-3 py-2">{d.issue_date}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(Number(d.total_cents) / 100).toLocaleString("en-KE", { minimumFractionDigits: 2 })} {d.currency}</td>
                    <td className="px-3 py-2 capitalize">{d.status}</td>
                    <td className="px-3 py-2 text-right">
                      <Button asChild variant="ghost" size="icon" aria-label="Edit">
                        <Link to="/admin/documents/$id" params={{ id: d.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}