import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: () => (
    <ResourceManager
      title="Pages"
      description="SEO metadata and content records for site pages."
      table="pages"
      orderBy={{ column: "slug", ascending: true }}
      defaultValues={{ is_published: true }}
      listColumns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "is_published", label: "Published" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug", type: "slug", required: true },
        { key: "seo_title", label: "SEO title", type: "text" },
        { key: "meta_description", label: "Meta description", type: "textarea" },
        { key: "meta_keywords", label: "Meta keywords", type: "text" },
        { key: "canonical_url", label: "Canonical URL", type: "url" },
        { key: "og_image_url", label: "OG image", type: "image" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
