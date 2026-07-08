import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getPortfolioProject } from "@/lib/catalog.functions";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: async ({ params }) => {
    const project = await getPortfolioProject({ data: { slug: params.slug } });
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project not found" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.project;
    const title = p.seo_title ?? `${p.title} — Shachavir Timber Limited`;
    const baseDesc = (p.meta_description ?? p.description ?? "").trim();
    const desc =
      baseDesc.slice(0, 200) ||
      `${p.title}${p.location ? ` in ${p.location}` : ""} — a Shachavir Timber project.`;
    const url = absoluteUrl(`/portfolio/${params.slug}`);
    const img = p.image_absolute;

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:type", content: "article" },
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

    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: p.title,
      description: baseDesc || undefined,
      image: img || undefined,
      creator: { "@type": "Organization", name: "Shachavir Timber Limited" },
      locationCreated: p.location || undefined,
      dateCreated: p.completion_date || undefined,
    };

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(ld) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Project not found</h1>
      <Link
        to="/portfolio"
        className="mt-6 inline-block rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Back to portfolio
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Couldn't load this project</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: PortfolioProjectPage,
});

function PortfolioProjectPage() {
  const { project } = Route.useLoaderData();
  const gallery = [project.cover_image_url, ...(project.images ?? [])].filter(
    (v, i, a): v is string => !!v && a.indexOf(v) === i,
  );
  const hero = gallery[0] ?? "/assets/images/placeholder.jpg";
  const meta = [project.client, project.location, project.completion_date]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/portfolio" className="text-sm text-muted-foreground hover:underline">
        ← Back to portfolio
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{project.title}</h1>
      {meta && <p className="mt-1 text-muted-foreground">{meta}</p>}
      <img
        src={hero}
        alt={project.title}
        className="mt-6 w-full rounded-lg object-cover"
      />
      {gallery.length > 1 && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {gallery.slice(1).map((src) => (
            <img key={src} src={src} alt="" className="w-full rounded object-cover" />
          ))}
        </div>
      )}
      {project.description && (
        <p className="mt-8 whitespace-pre-line leading-relaxed">
          {project.description}
        </p>
      )}
      <Link
        to="/contact"
        className="mt-10 inline-block rounded bg-primary px-6 py-3 font-medium text-primary-foreground"
      >
        Request a similar project
      </Link>
    </main>
  );
}
