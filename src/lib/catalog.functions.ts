import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SITE_URL } from "@/lib/site";

function sb() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function origin(): string {
  return SITE_URL;
}

function absolutize(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!base) return null;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function firstImage(cover: string | null, images: unknown): string | null {
  if (cover) return cover;
  if (Array.isArray(images) && images.length) {
    const first = images.find((i) => typeof i === "string" && i.trim());
    if (first) return String(first);
  }
  return null;
}

export const getShopProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { data: row } = await sb()
      .from("shop_products")
      .select(
        "slug,title,description,image_url,images,price_cents,currency,category,in_stock,is_featured",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!row) return null;
    const base = origin();
    const img = firstImage(row.image_url, row.images);
    return {
      ...row,
      images: Array.isArray(row.images) ? (row.images as unknown[]).filter((i) => typeof i === "string") as string[] : [],
      image_absolute: absolutize(img, base),
      origin: base,
    };
  });

export const getRelatedShopProducts = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string; category: string | null; limit?: number }) => data)
  .handler(async ({ data }) => {
    const limit = data.limit ?? 4;
    const client = sb();
    const base = origin();
    const cols =
      "slug,title,image_url,images,price_cents,currency,category";

    const results: Array<Record<string, unknown>> = [];
    const seen = new Set<string>([data.slug]);

    if (data.category) {
      const { data: sameCat } = await client
        .from("shop_products")
        .select(cols)
        .eq("is_published", true)
        .eq("category", data.category)
        .neq("slug", data.slug)
        .limit(limit);
      for (const r of sameCat ?? []) {
        if (!seen.has(r.slug)) {
          seen.add(r.slug);
          results.push(r);
        }
      }
    }

    if (results.length < limit) {
      const { data: fill } = await client
        .from("shop_products")
        .select(cols)
        .eq("is_published", true)
        .neq("slug", data.slug)
        .limit(limit + seen.size);
      for (const r of fill ?? []) {
        if (results.length >= limit) break;
        if (!seen.has(r.slug)) {
          seen.add(r.slug);
          results.push(r);
        }
      }
    }

    return results.slice(0, limit).map((r) => {
      const images = Array.isArray(r.images)
        ? ((r.images as unknown[]).filter((i) => typeof i === "string") as string[])
        : [];
      const img = firstImage(r.image_url as string | null, images);
      return {
        slug: r.slug as string,
        title: r.title as string,
        image_url: (r.image_url as string | null) ?? null,
        images,
        price_cents: (r.price_cents as number | null) ?? null,
        currency: (r.currency as string | null) ?? null,
        category: (r.category as string | null) ?? null,
        image_absolute: absolutize(img, base),
      };
    });
  });

export const getPortfolioProject = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { data: row } = await sb()
      .from("portfolio_projects")
      .select(
        "slug,title,description,cover_image_url,images,category,client,location,completion_date,seo_title,meta_description",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!row) return null;
    const base = origin();
    const img = firstImage(row.cover_image_url, row.images);
    return {
      ...row,
      images: Array.isArray(row.images) ? (row.images as unknown[]).filter((i) => typeof i === "string") as string[] : [],
      image_absolute: absolutize(img, base),
      origin: base,
    };
  });
