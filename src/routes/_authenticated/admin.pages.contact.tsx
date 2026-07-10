import { createFileRoute } from "@tanstack/react-router";
import { PageEditor, type PageEditorSpec } from "@/components/admin/PageEditor";

const spec: PageEditorSpec = {
  pageSlug: "contact",
  pageTitle: "Contact page",
  liveUrl: "/contact",
  intro: "Edit every section of the Contact page. Social links live in Site Settings.",
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
    {
      key: "details",
      title: "Contact details",
      fields: [
        { key: "address", label: "Address", type: "textarea" },
        {
          key: "phones",
          label: "Phone numbers",
          type: "repeater",
          itemLabel: "Phone",
          itemFields: [{ key: "number", label: "Phone number", type: "text" }],
          help: "Add as many phone numbers as you like. Each appears as a tap-to-call link on the Contact page.",
        },
        {
          key: "emails",
          label: "Email addresses",
          type: "repeater",
          itemLabel: "Email",
          itemFields: [{ key: "address", label: "Email address", type: "text" }],
          help: "Add as many email addresses as you like.",
        },
        { key: "map_embed_url", label: "Google Maps embed URL", type: "url", help: "Paste the src URL from the Google Maps embed code." },
      ],
    },
    {
      key: "hours",
      title: "Business hours",
      fields: [
        { key: "title", label: "Section title", type: "text" },
        {
          key: "items",
          label: "Hours",
          type: "repeater",
          itemLabel: "Row",
          itemFields: [
            { key: "day", label: "Day / label", type: "text" },
            { key: "hours", label: "Hours", type: "text" },
          ],
        },
      ],
    },
    {
      key: "form",
      title: "Contact form copy",
      fields: [
        { key: "title", label: "Form heading", type: "text" },
        { key: "subtitle", label: "Form subtitle", type: "textarea" },
        { key: "success_message", label: "Success message", type: "textarea" },
      ],
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/pages/contact")({
  component: () => <PageEditor spec={spec} />,
});
