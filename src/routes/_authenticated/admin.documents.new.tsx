import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/admin/DocumentEditor";

type Search = { type?: "invoice" | "quotation" | "receipt" | "estimate" };

export const Route = createFileRoute("/_authenticated/admin/documents/new")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const t = s.type;
    if (t === "invoice" || t === "quotation" || t === "receipt" || t === "estimate") return { type: t };
    return {};
  },
  component: NewDoc,
});

function NewDoc() {
  const { type } = Route.useSearch();
  const docType = type || "quotation";
  return <DocumentEditor key={docType} initialType={docType} />;
}
