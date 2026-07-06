import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getShopProduct } from "@/lib/catalog.functions";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const product = await getShopProduct({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    const priceMajor =
      p.price_cents != null ? (p.price_cents / 100).toFixed(2) : null;
    const priceLabel = priceMajor
      ? `${p.currency || "KES"} ${priceMajor}`
      : null;
    const baseDesc = (p.description ?? "").trim().slice(0, 200);
    const desc = priceLabel
      ? baseDesc
        ? `${baseDesc} — ${priceLabel}`
        : `${p.title} — ${priceLabel}`
      : baseDesc || `${p.title} by Shachavir Timber Limited.`;
    const title = `${p.title} — Shachavir Timber Limited`;
    const url = `/shop/${params.slug}`;
    const img = p.image_absolute;

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:type", content: "product" },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (img) {
      meta.push({ property: "og:image", content: img });
      meta.push({ name: "twitter:image", content: img });
    }
    if (priceMajor) {
      meta.push({ property: "product:price:amount", content: priceMajor });
      meta.push({ property: "product:price:currency", content: p.currency || "KES" });
      meta.push({
        property: "og:availability",
        content: p.in_stock ? "instock" : "oos",
      });
    }

    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title,
      description: baseDesc || undefined,
      image: img || undefined,
      category: p.category || undefined,
      brand: { "@type": "Brand", name: "Shachavir Timber Limited" },
    };
    if (priceMajor) {
      ld.offers = {
        "@type": "Offer",
        price: priceMajor,
        priceCurrency: p.currency || "KES",
        availability: p.in_stock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      };
    }

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(ld),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Product not found</h1>
      <p className="mt-2 text-muted-foreground">
        The product you're looking for is no longer available.
      </p>
      <Link
        to="/shop"
        className="mt-6 inline-block rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Browse shop
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Couldn't load this product</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: ShopProductPage,
});

function ShopProductPage() {
  const { product } = Route.useLoaderData();
  const price =
    product.price_cents != null
      ? `${product.currency || "KES"} ${(product.price_cents / 100).toLocaleString()}`
      : null;
  const gallery = [product.image_url, ...(product.images ?? [])].filter(
    (v, i, a): v is string => !!v && a.indexOf(v) === i,
  );
  const heroImg = gallery[0] ?? "/assets/images/placeholder.jpg";
  const waMsg = encodeURIComponent(`Hello, I'm interested in ${product.title}`);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/shop" className="text-sm text-muted-foreground hover:underline">
        ← Back to shop
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <img
            src={heroImg}
            alt={product.title}
            className="w-full rounded-lg object-cover"
          />
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gallery.slice(1, 9).map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="aspect-square w-full rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <div>
          {product.category && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {product.category}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>
          {price && (
            <p className="mt-3 text-2xl font-semibold text-primary">{price}</p>
          )}
          <p className="mt-1 text-sm">
            {product.in_stock ? (
              <span className="text-green-700">In stock</span>
            ) : (
              <span className="text-red-700">Out of stock</span>
            )}
          </p>
          {product.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground">
              {product.description}
            </p>
          )}
          <a
            href={`https://wa.me/254721499606?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded bg-primary px-6 py-3 font-medium text-primary-foreground"
          >
            Request a quote on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
