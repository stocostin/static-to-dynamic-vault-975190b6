import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage, getPortfolio } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";
import { useMemo, useState } from "react";

const pageQuery = queryOptions({ queryKey: ["page", "portfolio"], queryFn: () => getSitePage({ data: { slug: "portfolio" } }) });
const portfolioQuery = queryOptions({ queryKey: ["portfolio", "all"], queryFn: () => getPortfolio() });

export const Route = createFileRoute("/portfolio")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
      context.queryClient.ensureQueryData(portfolioQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || "Portfolio — Shachavir Timber";
    const desc = p?.meta_description || "A selection of custom woodwork projects we've delivered.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: "/portfolio" },
      ],
      links: [{ rel: "canonical", href: "/portfolio" }],
    };
  },
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const { data: items } = useSuspenseQuery(portfolioQuery);
  const c = (page?.content_json ?? {}) as { lead?: string };
  const [filter, setFilter] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const shown = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <SiteShell>
      <PageHero eyebrow="Portfolio" title={page?.title || "Selected work"} subtitle={c.lead} image={page?.hero_image_url} />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                filter === cat ? "bg-foreground text-background border-foreground" : "border-border/60 hover:border-foreground/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((p) => (
            <article key={p.id} className="group rounded-lg overflow-hidden border border-border/60 bg-card">
              <div className="aspect-[4/5] bg-muted overflow-hidden">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                )}
              </div>
              <div className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
                <h2 className="font-serif text-lg font-bold mt-1">{p.title}</h2>
                {p.client && <div className="text-xs text-muted-foreground mt-0.5">{p.client}</div>}
                {p.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{p.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
