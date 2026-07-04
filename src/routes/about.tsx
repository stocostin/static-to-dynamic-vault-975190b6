import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage, getTeam } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";

const pageQuery = queryOptions({ queryKey: ["page", "about"], queryFn: () => getSitePage({ data: { slug: "about" } }) });
const teamQuery = queryOptions({ queryKey: ["team"], queryFn: () => getTeam() });

export const Route = createFileRoute("/about")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
      context.queryClient.ensureQueryData(teamQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || "About — Shachavir Timber Limited";
    const desc = p?.meta_description || "Meet the team behind Kenya's premium custom joinery workshop.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: "/about" },
      ],
      links: [{ rel: "canonical", href: "/about" }],
    };
  },
  component: AboutPage,
});

type Value = { title: string; body: string };

function AboutPage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const { data: team } = useSuspenseQuery(teamQuery);
  const c = (page?.content_json ?? {}) as { story_title?: string; story_body?: string; values?: Value[] };
  const values = Array.isArray(c.values) ? c.values : [];

  return (
    <SiteShell>
      <PageHero eyebrow="About" title={page?.title || "Who we are"} subtitle={page?.excerpt} image={page?.hero_image_url} />

      <section className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-10 items-start">
        <h2 className="font-serif text-3xl font-bold tracking-tight">{c.story_title || "Our story"}</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">{c.story_body}</p>
      </section>

      {values.length > 0 && (
        <section className="border-y border-border/60 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-6">
                <div className="font-serif text-lg font-bold mb-2">{v.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-serif text-3xl font-bold tracking-tight mb-10">The team</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {team.map((m) => (
              <div key={m.id} className="rounded-lg border border-border/60 bg-card p-6">
                <div className="aspect-square rounded-md bg-muted overflow-hidden mb-4">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-3xl font-serif">
                      {m.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                  )}
                </div>
                <div className="font-serif text-lg font-bold">{m.name}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">{m.position}</div>
                {m.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{m.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
