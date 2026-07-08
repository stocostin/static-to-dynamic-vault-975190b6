import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/admin/DocumentEditor";

export const Route = createFileRoute("/_authenticated/admin/documents/$id")({
  component: EditDoc,
});

function EditDoc() {
  const { id } = Route.useParams();
  return <DocumentEditor key={id} id={id} />;
}
