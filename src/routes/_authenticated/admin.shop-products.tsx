import { createFileRoute } from "@tanstack/react-router";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/shop-products")({
  component: () => (
    <ResourceManager
      title="Shop products"
      description="Products displayed on the Shop page. Featured products appear in the featured grid."
      table="shop_products"
      orderBy={{ column: "sort_order", ascending: true }}
      defaultValues={{ is_published: true, in_stock: true, currency: "KES", sort_order: 0 }}
      listColumns={[
        { key: "image_url", label: "" },
        { key: "title", label: "Product" },
        { key: "price_cents", label: "Price" },
        { key: "is_featured", label: "Featured" },
        { key: "is_published", label: "Published" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "slug", label: "Slug", type: "slug", required: true, help: "URL-friendly identifier, e.g. mahogany-dining-table" },
        { key: "description", label: "Description", type: "longtext" },
        { key: "image_url", label: "Main image (cover)", type: "image" },
        { key: "images", label: "Gallery images (auto-rotate)", type: "images", help: "Add multiple images; they auto-rotate on the shop page." },
        { key: "category", label: "Category", type: "text", help: "e.g. doors, frames, furniture, staircases" },
        { key: "price_cents", label: "Price (in cents / smallest unit)", type: "number", help: "45000 = KSh 450" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "in_stock", label: "In stock", type: "boolean" },
        { key: "is_featured", label: "Featured", type: "boolean" },
        { key: "is_published", label: "Published", type: "boolean" },
        { key: "sort_order", label: "Sort order", type: "number" },
      ]}
    />
  ),
});
