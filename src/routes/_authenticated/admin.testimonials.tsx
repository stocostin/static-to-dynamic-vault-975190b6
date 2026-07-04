import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  component: () => (
    <ResourceManager
      title="Testimonials"
      table="testimonials"
      defaultValues={{ is_published: true, is_featured: false, rating: 5, sort_order: 0 }}
      listColumns={[
        { key: "name", label: "Name" },
        { key: "company", label: "Company" },
        { key: "rating", label: "Rating" },
        { key: "is_published", label: "Published" },
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "position", label: "Position", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "review", label: "Review", type: "longtext", required: true },
        { key: "rating", label: "Rating (1-5)", type: "number" },
        { key: "photo_url", label: "Photo", type: "image" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "is_featured", label: "Featured", type: "boolean" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
