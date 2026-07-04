import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/menus")({
  component: () => (
    <ResourceManager
      title="Menus"
      description="Navigation menus. Manage items after creating a menu."
      table="menus"
      orderBy={{ column: "slug", ascending: true }}
      listColumns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug", type: "slug", required: true, help: "e.g. 'main', 'footer'" },
      ]}
    />
  ),
});
