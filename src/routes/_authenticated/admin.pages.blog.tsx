import { createFileRoute } from "@tanstack/react-router";
import { PageEditor, type PageEditorSpec } from "@/components/admin/PageEditor";

const spec: PageEditorSpec = {
  pageSlug: "blog",
  pageTitle: "Blog page",
  liveUrl: "/blog",
  intro:
    "Edit the Blog landing hero and intro copy. Individual posts are managed on the Blog posts screen.",
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
      key: "intro",
      title: "Intro",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body", type: "textarea" },
      ],
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/pages/blog")({
  component: () => <PageEditor spec={spec} />,
});
