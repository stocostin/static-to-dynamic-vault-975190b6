import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: DocumentsLayout,
});

function DocumentsLayout() {
  return <Outlet />;
}

