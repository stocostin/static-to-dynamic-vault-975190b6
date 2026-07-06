import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function sb() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function origin(): string {
  try {
    const req = getRequest();
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("host");
    if (host) return `${proto}://${host}`;
  } catch {
    /* no request context */
  }
  return "";
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
