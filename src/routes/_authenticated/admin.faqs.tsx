import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/faqs")({
  component: () => (
    <ResourceManager
      title="FAQs"
      table="faqs"
      defaultValues={{ is_published: true, sort_order: 0 }}
      listColumns={[
        { key: "question", label: "Question" },
        { key: "category", label: "Category" },
        { key: "is_published", label: "Published" },
        { key: "sort_order", label: "Order" },
      ]}
      fields={[
        { key: "question", label: "Question", type: "text", required: true },
        { key: "answer", label: "Answer", type: "longtext", required: true },
        { key: "category", label: "Category", type: "text" },
        { key: "sort_order", label: "Sort order", type: "number" },
        { key: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  ),
});
