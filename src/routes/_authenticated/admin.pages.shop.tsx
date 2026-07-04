import { createFileRoute } from "@tanstack/react-router";
import { PageEditor, type PageEditorSpec } from "@/components/admin/PageEditor";

const spec: PageEditorSpec = {
  pageSlug: "shop",
  pageTitle: "Shop page",
  liveUrl: "/shop",
  intro:
    "Edit the Shop page hero and section headings. Products themselves are managed on the Shop products screen.",
  sections: [
    {
      key: "hero",
      title: "Hero",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "image_url", label: "Background image", type: "image" },
      ],
    },
    {
      key: "featured",
      title: "Featured products — heading",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
      ],
    },
    {
      key: "all_products",
      title: "All products — heading",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
      ],
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/pages/shop")({
  component: () => <PageEditor spec={spec} />,
});
