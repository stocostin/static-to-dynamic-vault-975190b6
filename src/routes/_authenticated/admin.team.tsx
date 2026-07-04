import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: () => (
    <ResourceManager
      title="Team"
      table="team_members"
      defaultValues={{ is_published: true, sort_order: 0 }}
      listColumns={[
        { key: "name", label: "Name" },
        { key: "position", label: "Position" },
        { key: "email", label: "Email" },
        { key: "is_published", label: "Published" },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "position", label: "Position", type: "text" },
        { key: "bio", label: "Bio", type: "longtext" },
        { key: "email", label: "Email", type: "text" },
        { key: "phone", label: "Phone", type: "text" },
        { key: "photo_url", label: "Photo", type: "image" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
