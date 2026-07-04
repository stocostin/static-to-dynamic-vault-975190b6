import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSitePage, getFaqs, submitContactMessage } from "@/lib/site.functions";
import { SiteShell, PageHero, siteChromeQuery } from "@/components/site/SiteShell";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

const pageQuery = queryOptions({ queryKey: ["page", "contact"], queryFn: () => getSitePage({ data: { slug: "contact" } }) });
const faqsQuery = queryOptions({ queryKey: ["faqs"], queryFn: () => getFaqs() });

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteChromeQuery),
      context.queryClient.ensureQueryData(pageQuery),
      context.queryClient.ensureQueryData(faqsQuery),
    ]);
    return context.queryClient.getQueryData(pageQuery.queryKey);
  },
  head: ({ loaderData }) => {
    const p = loaderData ?? null;
    const title = p?.seo_title || "Contact — Shachavir Timber";
    const desc = p?.meta_description || "Get in touch to discuss a custom woodwork project.";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:url", content: "/contact" },
      ],
      links: [{ rel: "canonical", href: "/contact" }],
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const { data: page } = useSuspenseQuery(pageQuery);
  const { data: faqs } = useSuspenseQuery(faqsQuery);
  const c = (page?.content_json ?? {}) as { lead?: string };
  const router = useRouter();
  const submit = useServerFn(submitContactMessage);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await submit({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
          website: String(fd.get("website") ?? ""),
          source_page: "/contact",
        },
      });
      setSent(true);
      toast.success("Message sent — we'll get back to you shortly.");
      (e.target as HTMLFormElement).reset();
      router.invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <PageHero eyebrow="Contact" title={page?.title || "Let's talk"} subtitle={c.lead} image={page?.hero_image_url} />
      <section className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-12">
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Phone" name="phone" />
            <Field label="Subject" name="subject" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Message</label>
            <textarea name="message" required rows={6} className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <button
            type="submit"
            disabled={busy || sent}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {sent ? "Message sent" : "Send message"}
          </button>
        </form>
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold">Frequently asked</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.id} className="rounded-lg border border-border/60 bg-card p-4 group">
                <summary className="cursor-pointer font-medium text-sm">{f.question}</summary>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}{required && <span className="text-primary"> *</span>}</label>
      <input name={name} type={type} required={required} className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}
