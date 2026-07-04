// Server functions that read published content for the public marketing site.
// Uses a server-side publishable Supabase client — anon role only, subject to
// the "Public can read published …" RLS policies on each table.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublic() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type SitePage = {
  slug: string;
  title: string;
  seo_title: string | null;
  meta_description: string | null;
  hero_image_url: string | null;
  excerpt: string | null;
  content_json: Record<string, unknown> | null;
};

export type SiteService = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  category: string | null;
};

export type SitePortfolioItem = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  for_sale: boolean;
  price_cents: number | null;
  currency: string;
};

export type SiteMenuItem = { label: string; url: string; sort_order: number };
export type SiteTeamMember = { id: string; name: string; position: string | null; bio: string | null; photo_url: string | null };
export type SiteTestimonial = { id: string; name: string; company: string | null; review: string; rating: number | null };
export type SiteFaq = { id: string; question: string; answer: string; category: string | null };

export type SiteSettings = Record<string, string>;

export type SiteChrome = {
  settings: SiteSettings;
  primaryMenu: SiteMenuItem[];
  footerMenu: SiteMenuItem[];
};

export const getSiteChrome = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const [settingsRes, menusRes, itemsRes] = await Promise.all([
    sb.from("site_settings").select("key,value"),
    sb.from("menus").select("id,slug"),
    sb.from("menu_items").select("menu_id,label,url,sort_order,is_visible").order("sort_order"),
  ]);
  const settings: SiteSettings = {};
  for (const row of settingsRes.data ?? []) {
    const v = row.value as unknown;
    settings[row.key] = typeof v === "string" ? v : v == null ? "" : String(v);
  }
  const menuBySlug = new Map<string, string>();
  for (const m of menusRes.data ?? []) menuBySlug.set(m.slug, m.id);
  const filterMenu = (slug: string): SiteMenuItem[] => {
    const id = menuBySlug.get(slug);
    if (!id) return [];
    return (itemsRes.data ?? [])
      .filter((i) => i.menu_id === id && i.is_visible)
      .map((i) => ({ label: i.label, url: i.url, sort_order: i.sort_order }));
  };
  return {
    settings,
    primaryMenu: filterMenu("primary"),
    footerMenu: filterMenu("footer"),
  } satisfies SiteChrome;
});

export const getSitePage = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<SitePage | null> => {
    const sb = serverPublic();
    const { data: page } = await sb
      .from("pages")
      .select("slug,title,seo_title,meta_description,hero_image_url,excerpt,content_json")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    return (page as SitePage | null) ?? null;
  });

export const getServices = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("services")
    .select("id,slug,title,short_description,description,icon,image_url,category")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as SiteService[];
});

export const getPortfolio = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("portfolio_projects")
    .select("id,slug,title,client,description,category,cover_image_url,for_sale,price_cents,currency")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as SitePortfolioItem[];
});

export const getShopItems = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("portfolio_projects")
    .select("id,slug,title,client,description,category,cover_image_url,for_sale,price_cents,currency")
    .eq("is_published", true)
    .eq("for_sale", true)
    .order("sort_order");
  return (data ?? []) as SitePortfolioItem[];
});

export const getTeam = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("team_members")
    .select("id,name,position,bio,photo_url")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as SiteTeamMember[];
});

export const getTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("testimonials")
    .select("id,name,company,review,rating")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as SiteTestimonial[];
});

export const getFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const { data } = await sb
    .from("faqs")
    .select("id,question,answer,category")
    .eq("is_published", true)
    .order("sort_order");
  return (data ?? []) as SiteFaq[];
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    source_page?: string;
    website?: string; // honeypot
  }) => input)
  .handler(async ({ data }) => {
    if (data.website && data.website.trim().length > 0) return { ok: true }; // honeypot
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      throw new Error("Please fill in name, email and message.");
    }
    const sb = serverPublic();
    const { error } = await sb.from("contact_messages").insert({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
      source_page: data.source_page ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
