import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";

const pageQuery = queryOptions({ queryKey: ["page", "blog"], queryFn: () => getSitePage({ data: { slug: "blog" } }) });

export const Route = createFileRoute("/blog")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || "Journal — Shachavir Timber";
    const desc = p?.meta_description || "Notes from the workshop.";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:url", content: "/blog" },
      ],
      links: [{ rel: "canonical", href: "/blog" }],
    };
  },
  component: BlogPage,
});

function BlogPage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const c = (page?.content_json ?? {}) as { lead?: string };
  return (
    <SiteShell>
      <PageHero eyebrow="Journal" title={page?.title || "Journal"} subtitle={c.lead} image={page?.hero_image_url} />
      <section className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Articles are on their way. Check back soon.
      </section>
    </SiteShell>
  );
}
