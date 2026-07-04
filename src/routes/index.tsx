import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage, getServices, getPortfolio, getTestimonials } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";
import { ArrowRight, Star } from "lucide-react";

const pageQuery = queryOptions({ queryKey: ["page", "home"], queryFn: () => getSitePage({ data: { slug: "home" } }) });
const servicesQuery = queryOptions({ queryKey: ["services", "featured"], queryFn: () => getServices() });
const portfolioQuery = queryOptions({ queryKey: ["portfolio", "all"], queryFn: () => getPortfolio() });
const testimonialsQuery = queryOptions({ queryKey: ["testimonials"], queryFn: () => getTestimonials() });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
      context.queryClient.ensureQueryData(servicesQuery),
      context.queryClient.ensureQueryData(portfolioQuery),
      context.queryClient.ensureQueryData(testimonialsQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || p?.title || "Shachavir Timber Limited";
    const desc = p?.meta_description || "Premium woodwork company specializing in custom doors, frames, staircases, and furniture in Kenya.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/" },
      ],
      links: [{ rel: "canonical", href: "/" }],
    };
  },
  component: HomePage,
});

function HomePage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const { data: services } = useSuspenseQuery(servicesQuery);
  const { data: portfolio } = useSuspenseQuery(portfolioQuery);
  const { data: testimonials } = useSuspenseQuery(testimonialsQuery);

  const c = (page?.content_json ?? {}) as Record<string, string>;
  const featured = portfolio.filter((p) => (p as { for_sale?: boolean }) && true).slice(0, 4);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Shachavir Timber Limited"
        title={c.hero_title || "Crafting Kenya's Finest Woodwork"}
        subtitle={c.hero_subtitle}
        image={page?.hero_image_url}
      />

      <section className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">{c.intro_title || "A workshop rooted in craftsmanship"}</h2>
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed">{c.intro_body}</p>
      </section>

      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif text-3xl font-bold tracking-tight">What we build</h2>
            <a href="/services" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">See all services <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.slice(0, 4).map((s) => (
              <div key={s.id} className="group rounded-lg border border-border/60 bg-card p-6 hover:border-primary/40 transition-colors">
                <div className="font-serif text-lg font-bold mb-2">{s.title}</div>
                <p className="text-sm text-muted-foreground">{s.short_description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-serif text-3xl font-bold tracking-tight">Recent work</h2>
          <a href="/portfolio" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">Full portfolio <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((p) => (
            <div key={p.id} className="group rounded-lg overflow-hidden border border-border/60 bg-card">
              <div className="aspect-[4/5] bg-muted overflow-hidden">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
                <div className="font-serif text-base font-bold mt-1">{p.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="font-serif text-3xl font-bold tracking-tight mb-10">What our clients say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="rounded-lg border border-border/60 bg-card p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-sm leading-relaxed">"{t.review}"</blockquote>
                  <figcaption className="mt-4 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{t.name}</div>
                    {t.company && <div>{t.company}</div>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight max-w-2xl mx-auto">
          Have a piece in mind? Let's draw it up.
        </h2>
        <a href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90">
          Start a project <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </SiteShell>
  );
}
