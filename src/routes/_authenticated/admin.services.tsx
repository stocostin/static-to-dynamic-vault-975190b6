import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: () => (
    <ResourceManager
      title="Services"
      description="Services shown on the public /services page."
      table="services"
      defaultValues={{ is_published: true, is_featured: false, sort_order: 0 }}
      listColumns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "category", label: "Category" },
        { key: "is_published", label: "Published" },
        { key: "sort_order", label: "Order" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug", type: "slug", required: true, help: "URL-friendly identifier, e.g. 'timber-frame'" },
        { key: "category", label: "Category", type: "text" },
        { key: "short_description", label: "Short description", type: "textarea" },
        { key: "description", label: "Full description", type: "longtext" },
        { key: "icon", label: "Icon (lucide name or class)", type: "text" },
        { key: "image_url", label: "Image", type: "image" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "is_featured", label: "Featured", type: "boolean" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
