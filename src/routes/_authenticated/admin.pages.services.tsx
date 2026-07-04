import { createFileRoute } from "@tanstack/react-router";
import { PageEditor, type PageEditorSpec } from "@/components/admin/PageEditor";

const spec: PageEditorSpec = {
  pageSlug: "services",
  pageTitle: "Services page",
  liveUrl: "/services",
  intro:
    "Edit the Services page hero, intro copy, and the closing call-to-action. Individual services (title, description, features, image) are managed on the Services screen.",
  sections: [
    {
      key: "hero",
      title: "Hero",
      fields: [
        { key: "title", label: "Title", type: "text", placeholder: "Expert Woodwork Services in Kenya" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "image_url", label: "Background image", type: "image" },
      ],
    },
    {
      key: "what_we_offer",
      title: "What We Offer — intro",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
      ],
    },
    {
      key: "cta_footer",
      title: "Bottom call-to-action",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
        { key: "cta_label", label: "Button label", type: "text" },
        { key: "cta_url", label: "Button URL", type: "url" },
      ],
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/pages/services")({
  component: () => <PageEditor spec={spec} />,
});
