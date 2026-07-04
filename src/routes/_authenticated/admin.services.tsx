import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/services")({
  component: () => (
    <ResourceManager
      title="Services"
      description="Each service becomes a card on the home page AND a detail block on the /services page."
      table="services"
      defaultValues={{ is_published: true, is_featured: false, sort_order: 0, features: [] }}
      listColumns={[
        { key: "image_url", label: "" },
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "category", label: "Category" },
        { key: "is_published", label: "Published" },
        { key: "sort_order", label: "Order" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug (also the anchor on the services page)", type: "slug", required: true, help: "e.g. 'doors' → /services#doors" },
        { key: "category", label: "Category", type: "text" },
        { key: "short_description", label: "Short description (home page card)", type: "textarea" },
        { key: "long_description", label: "Long description (services page detail block)", type: "longtext" },
        { key: "features", label: "Feature bullets", type: "stringlist", help: "One feature per line — shown as check-marked list on the services page." },
        { key: "icon", label: "Icon (FontAwesome name, e.g. 'door-open')", type: "text" },
        { key: "image_url", label: "Detail image", type: "image" },
        { key: "cta_label", label: "Primary CTA label", type: "text", placeholder: "View Door Projects" },
        { key: "cta_url", label: "Primary CTA URL", type: "url", placeholder: "/portfolio?filter=doors" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "is_featured", label: "Featured", type: "boolean" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
