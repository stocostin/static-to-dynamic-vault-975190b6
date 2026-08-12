import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://shachavirtimber.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sitemapLoc(path: string): string {
  return encodeURI(BASE_URL + path).replace(/#/g, "%23");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.8" },
          { path: "/services", changefreq: "monthly", priority: "0.8" },
          { path: "/portfolio", changefreq: "weekly", priority: "0.7" },
          { path: "/shop", changefreq: "weekly", priority: "0.7" },
          { path: "/blog", changefreq: "weekly", priority: "0.6" },
          { path: "/contact", changefreq: "yearly", priority: "0.6" },
        ];

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key);
            const [portfolio, shop, blog] = await Promise.all([
              sb.from("portfolio_projects").select("slug").eq("is_published", true),
              sb.from("shop_products").select("slug").eq("is_published", true),
              sb.from("blog_posts").select("slug").eq("is_published", true),
            ]);
            for (const r of portfolio.data ?? []) if (r.slug) entries.push({ path: `/portfolio/${r.slug}`, changefreq: "monthly", priority: "0.6" });
            for (const r of shop.data ?? []) if (r.slug) entries.push({ path: `/shop/${r.slug}`, changefreq: "weekly", priority: "0.6" });
            for (const r of blog.data ?? []) if (r.slug) entries.push({ path: `/blog/${r.slug}`, changefreq: "monthly", priority: "0.5" });
          }
        } catch (err) {
          console.error("[sitemap] dynamic fetch failed:", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(sitemapLoc(e.path))}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
