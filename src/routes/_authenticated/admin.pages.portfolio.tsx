import { createFileRoute } from "@tanstack/react-router";
import { PageEditor, type PageEditorSpec } from "@/components/admin/PageEditor";

const spec: PageEditorSpec = {
  pageSlug: "portfolio",
  pageTitle: "Portfolio page",
  liveUrl: "/portfolio",
  intro:
    "Edit the Portfolio page hero, intro copy, and bottom call-to-action. Individual projects are managed on the Portfolio screen.",
  sections: [
    {
      key: "hero",
      title: "Hero",
      fields: [
        { key: "title", label: "Title", type: "text", placeholder: "Crafted to Impress — See What We Build" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "image_url", label: "Background image", type: "image" },
      ],
    },
    {
      key: "filters_intro",
      title: "Filters / intro copy",
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

export const Route = createFileRoute("/_authenticated/admin/pages/portfolio")({
  component: () => <PageEditor spec={spec} />,
});
