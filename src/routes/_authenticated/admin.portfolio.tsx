import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({
  component: () => (
    <ResourceManager
      title="Portfolio"
      description="Portfolio projects shown on the public /portfolio page."
      table="portfolio_projects"
      defaultValues={{ is_published: true, is_featured: false, sort_order: 0 }}
      listColumns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "client", label: "Client" },
        { key: "category", label: "Category" },
        { key: "is_published", label: "Published" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug", type: "slug", required: true },
        { key: "category", label: "Category", type: "text" },
        { key: "client", label: "Client", type: "text" },
        { key: "location", label: "Location", type: "text", placeholder: "e.g. Karen, Nairobi" },
        { key: "completion_date", label: "Completion date", type: "text", placeholder: "YYYY-MM-DD" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "cover_image_url", label: "Cover image", type: "image" },
        { key: "seo_title", label: "SEO title", type: "text" },
        { key: "meta_description", label: "Meta description", type: "textarea" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "is_featured", label: "Featured", type: "boolean" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
