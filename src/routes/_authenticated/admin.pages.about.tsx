import { createFileRoute } from "@tanstack/react-router";
import { PageEditor, type PageEditorSpec } from "@/components/admin/PageEditor";

const spec: PageEditorSpec = {
  pageSlug: "about",
  pageTitle: "About page",
  liveUrl: "/about",
  intro: "Edit every section of the About page. Team members are managed on the Team screen.",
  sections: [
    {
      key: "hero",
      title: "Hero",
      description: "Top banner of the About page.",
      fields: [
        { key: "eyebrow", label: "Eyebrow (small text)", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "image_url", label: "Background image", type: "image" },
      ],
    },
    {
      key: "our_story",
      title: "Our Story",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Body (use blank line for a paragraph break)", type: "longtext" },
        { key: "image_url", label: "Image", type: "image" },
        { key: "badge_number", label: "Badge number", type: "text", help: "Example: 13+" },
        { key: "badge_text", label: "Badge text", type: "text", help: "Example: Years of Excellence" },
      ],
    },
    {
      key: "mission_vision",
      title: "Mission, Vision & Objective",
      fields: [
        { key: "title", label: "Section title", type: "text" },
        { key: "mission_title", label: "Mission — heading", type: "text" },
        { key: "mission_body", label: "Mission — body", type: "textarea" },
        { key: "vision_title", label: "Vision — heading", type: "text" },
        { key: "vision_body", label: "Vision — body", type: "textarea" },
        { key: "objective_title", label: "Objective — heading", type: "text" },
        { key: "objective_body", label: "Objective — body", type: "textarea" },
      ],
    },
    {
      key: "process",
      title: "Our Process",
      fields: [
        { key: "title", label: "Section title", type: "text" },
        { key: "intro", label: "Intro paragraph", type: "textarea" },
        {
          key: "steps",
          label: "Process steps",
          type: "repeater",
          itemLabel: "Step",
          itemFields: [
            { key: "title", label: "Step title", type: "text" },
            { key: "body", label: "Step description", type: "textarea" },
          ],
        },
        { key: "summary", label: "Closing paragraph", type: "textarea" },
      ],
    },
    {
      key: "team_intro",
      title: "Meet Our Craftsmen — heading",
      description: "Only the heading and intro. Team cards are managed on the Team screen.",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "body", label: "Subtitle", type: "textarea" },
      ],
    },
  ],
};

export const Route = createFileRoute("/_authenticated/admin/pages/about")({
  component: () => <PageEditor spec={spec} />,
});
