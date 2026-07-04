import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage, getServices } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";

const pageQuery = queryOptions({ queryKey: ["page", "services"], queryFn: () => getSitePage({ data: { slug: "services" } }) });
const servicesQuery = queryOptions({ queryKey: ["services"], queryFn: () => getServices() });

export const Route = createFileRoute("/services")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
      context.queryClient.ensureQueryData(servicesQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || "Services — Shachavir Timber";
    const desc = p?.meta_description || "Custom doors, frames, staircases and furniture in Kenya.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: "/services" },
      ],
      links: [{ rel: "canonical", href: "/services" }],
    };
  },
  component: ServicesPage,
});

function ServicesPage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const { data: services } = useSuspenseQuery(servicesQuery);
  const c = (page?.content_json ?? {}) as { lead?: string };

  return (
    <SiteShell>
      <PageHero eyebrow="Services" title={page?.title || "What we build"} subtitle={c.lead} image={page?.hero_image_url} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s) => (
            <article key={s.id} className="rounded-lg border border-border/60 bg-card overflow-hidden">
              {s.image_url && (
                <div className="aspect-[16/9] bg-muted overflow-hidden">
                  <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.category}</div>
                <h2 className="font-serif text-2xl font-bold mt-1">{s.title}</h2>
                <p className="text-muted-foreground mt-3 leading-relaxed">{s.description || s.short_description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
