import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage, getShopItems } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";

const pageQuery = queryOptions({ queryKey: ["page", "shop"], queryFn: () => getSitePage({ data: { slug: "shop" } }) });
const shopQuery = queryOptions({ queryKey: ["shop"], queryFn: () => getShopItems() });

export const Route = createFileRoute("/shop")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
      context.queryClient.ensureQueryData(shopQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || "Shop — Shachavir Timber";
    const desc = p?.meta_description || "Ready-made timber pieces available for immediate order.";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:url", content: "/shop" },
      ],
      links: [{ rel: "canonical", href: "/shop" }],
    };
  },
  component: ShopPage,
});

function formatPrice(cents: number | null, currency: string) {
  if (cents == null) return null;
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function ShopPage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const { data: items } = useSuspenseQuery(shopQuery);
  const c = (page?.content_json ?? {}) as { lead?: string };

  return (
    <SiteShell>
      <PageHero eyebrow="Shop" title={page?.title || "Ready to order"} subtitle={c.lead} image={page?.hero_image_url} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            No items in the shop yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => {
              const price = formatPrice(p.price_cents, p.currency);
              return (
                <article key={p.id} className="rounded-lg overflow-hidden border border-border/60 bg-card flex flex-col">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
                    <h2 className="font-serif text-lg font-bold mt-1">{p.title}</h2>
                    {p.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{p.description}</p>}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      {price && <div className="font-serif text-lg font-bold">{price}</div>}
                      <a href={`/contact?subject=${encodeURIComponent("Order: " + p.title)}`} className="ml-auto rounded-full bg-primary text-primary-foreground text-xs font-medium px-4 py-2 hover:opacity-90">
                        Enquire
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
