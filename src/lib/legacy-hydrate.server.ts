import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  parseDoc,
  setInner,
  setMeta,
  setTitle,
  escapeHtml,
  type HTMLElement,
} from "./legacy-templating";

// --- server-only publishable client -----------------------------------------

let _client: SupabaseClient<Database> | null = null;
function sb(): SupabaseClient<Database> {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase env not configured");
    _client = createClient<Database>(url, key, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _client;
}

// --- version-keyed cache ----------------------------------------------------
// Fetch the tiny content_version key each request; other data caches until the
// version bumps (any admin edit) or 5s passes.

type Entry<T> = { at: number; version: string; data: T };
const TTL = 5_000;
const cache = new Map<string, Entry<unknown>>();

async function getContentVersion(): Promise<string> {
  try {
    const { data } = await sb()
      .from("site_settings")
      .select("value")
      .eq("key", "content_version")
      .maybeSingle();
    const v = data?.value as unknown;
    return typeof v === "string" ? v : v == null ? "0" : String(v);
  } catch {
    return "0";
  }
}

async function cached<T>(
  key: string,
  version: string,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key) as Entry<T> | undefined;
  if (hit && hit.version === version && Date.now() - hit.at < TTL) return hit.data;
  const data = await loader();
  cache.set(key, { at: Date.now(), version, data });
  return data;
}

// --- shared loaders ---------------------------------------------------------

type SiteContext = {
  version: string;
  settings: Record<string, string>;
  pages: Map<string, PageMeta>;
  menus: Map<string, MenuItem[]>;
};

type PageMeta = {
  id: string;
  slug: string;
  title: string | null;
  seo_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
};

type MenuItem = {
  label: string;
  url: string;
  sort_order: number;
  open_in_new_tab: boolean;
};

type SectionOverride = {
  section_key: string;
  content: Record<string, unknown>;
};

async function loadSiteContext(version: string): Promise<SiteContext> {
  return cached(`site-context`, version, async () => {
    const c = sb();
    const [settings, pages, menus, items] = await Promise.all([
      c.from("site_settings").select("key,value"),
      c
        .from("pages")
        .select("id,slug,title,seo_title,meta_description,og_image_url,canonical_url")
        .eq("is_published", true),
      c.from("menus").select("id,slug"),
      c
        .from("menu_items")
        .select("menu_id,label,url,sort_order,open_in_new_tab,is_visible")
        .order("sort_order", { ascending: true }),
    ]);

    const s: Record<string, string> = {};
    for (const row of settings.data ?? []) {
      const v = row.value as unknown;
      s[row.key] = typeof v === "string" ? v : v == null ? "" : String(v);
    }

    const p = new Map<string, PageMeta>();
    for (const row of pages.data ?? []) p.set(row.slug, row as PageMeta);

    const menuIdToSlug = new Map<string, string>();
    for (const m of menus.data ?? []) menuIdToSlug.set(m.id, m.slug);

    const menuMap = new Map<string, MenuItem[]>();
    for (const it of items.data ?? []) {
      if (it.is_visible === false) continue;
      const slug = menuIdToSlug.get(it.menu_id);
      if (!slug) continue;
      const arr = menuMap.get(slug) ?? [];
      arr.push({
        label: it.label,
        url: it.url,
        sort_order: it.sort_order ?? 0,
        open_in_new_tab: !!it.open_in_new_tab,
      });
      menuMap.set(slug, arr);
    }

    return { version, settings: s, pages: p, menus: menuMap };
  });
}

async function loadServices(version: string) {
  return cached("services", version, async () => {
    const { data } = await sb()
      .from("services")
      .select("slug,title,short_description,long_description,icon,image_url,features,cta_label,cta_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadPortfolio(version: string) {
  return cached("portfolio", version, async () => {
    const { data } = await sb()
      .from("portfolio_projects")
      .select("slug,title,client,location,category,cover_image_url,images,is_featured")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadBlogPosts(version: string) {
  return cached("blog_posts", version, async () => {
    const { data } = await sb()
      .from("blog_posts")
      .select("slug,title,excerpt,cover_image_url,category,published_at,is_published")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false });
    return data ?? [];
  });
}

async function loadShopProducts(version: string) {
  return cached("shop_products", version, async () => {
    const { data } = await sb()
      .from("shop_products")
      .select("slug,title,description,image_url,images,price_cents,currency,category,in_stock,is_featured")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadTestimonials(version: string) {
  return cached("testimonials", version, async () => {
    const { data } = await sb()
      .from("testimonials")
      .select("name,company,review")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadTeam(version: string) {
  return cached("team", version, async () => {
    const { data } = await sb()
      .from("team_members")
      .select("name,position,bio,photo_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadPageSections(
  version: string,
  pageId: string,
): Promise<SectionOverride[]> {
  return cached(`page-sections:${pageId}`, version, async () => {
    const { data } = await sb()
      .from("page_sections")
      .select("section_key,content,is_visible,sort_order")
      .eq("page_id", pageId)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    return (data ?? []).map((r) => ({
      section_key: r.section_key,
      content: (r.content as Record<string, unknown>) ?? {},
    }));
  });
}

// --- icon map ---------------------------------------------------------------

const ICON_MAP: Record<string, string> = {
  "door-open": "door-open",
  square: "border-style",
  stairs: "stairs",
  armchair: "couch",
  hammer: "hammer",
  couch: "couch",
};

function faIcon(icon: string | null | undefined): string {
  const k = (icon ?? "").trim();
  if (!k) return "fas fa-star";
  const mapped = ICON_MAP[k] ?? k.replace(/^fa-/, "");
  return `fas fa-${mapped}`;
}

// --- fragment renderers -----------------------------------------------------

function renderServiceCards(
  rows: Array<{ slug: string; title: string; short_description: string | null; icon: string | null }>,
): string {
  return rows
    .map(
      (r) => `
                <div class="service-card">
                    <div class="service-icon">
                        <i class="${faIcon(r.icon)}"></i>
                    </div>
                    <h3>${escapeHtml(r.title)}</h3>
                    <p>${escapeHtml(r.short_description ?? "")}</p>
                    <a href="/services#${escapeHtml(r.slug)}" class="btn-link">Learn More</a>
                </div>`,
    )
    .join("");
}

function renderServiceListLinks(
  rows: Array<{ slug: string; title: string }>,
): string {
  return rows
    .map(
      (r) =>
        `<li><a href="#${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></li>`,
    )
    .join("");
}

function pickImages(primary: string | null | undefined, extra: unknown): string[] {
  const arr = Array.isArray(extra) ? (extra as unknown[]).map((x) => String(x)).filter(Boolean) : [];
  const list = primary ? [primary, ...arr.filter((u) => u !== primary)] : arr.slice();
  return list.filter(Boolean);
}

function rotatingImg(images: string[], fallback: string, alt: string): string {
  const list = images.length ? images : [fallback];
  const first = list[0];
  if (list.length < 2) {
    return `<img src="${escapeHtml(first)}" alt="${escapeHtml(alt)}">`;
  }
  const data = escapeHtml(JSON.stringify(list));
  return `<img class="auto-rotate" data-images="${data}" src="${escapeHtml(first)}" alt="${escapeHtml(alt)}" style="transition:opacity .4s ease;">`;
}

function renderProjectCards(
  rows: Array<{ title: string; client: string | null; cover_image_url: string | null; images?: unknown }>,
): string {
  return rows
    .map((r) => {
      const imgs = pickImages(r.cover_image_url, r.images);
      return `
                <div class="project-card">
                    ${rotatingImg(imgs, "assets/images/placeholder.jpg", r.title)}
                    <div class="project-info">
                        <h3>${escapeHtml(r.title)}</h3>
                        <p>${escapeHtml(r.client ?? "")}</p>
                        <a href="/portfolio" class="btn-link">View More</a>
                    </div>
                </div>`;
    })
    .join("");
}

function renderPortfolioItems(
  rows: Array<{ title: string; client: string | null; location?: string | null; category: string | null; cover_image_url: string | null; images?: unknown }>,
): string {
  return rows
    .map((r) => {
      const cat = (r.category ?? "other").toLowerCase();
      const imgs = pickImages(r.cover_image_url, r.images);
      const primary = imgs[0] ?? "assets/images/placeholder.jpg";
      const meta = [r.client, r.location].filter(Boolean).join(" · ");
      return `
                <div class="portfolio-item" data-category="${escapeHtml(cat)}">
                    <a href="${escapeHtml(primary)}" data-lightbox="portfolio" data-title="${escapeHtml(r.title)}">
                        ${rotatingImg(imgs, "assets/images/placeholder.jpg", r.title)}
                        <div class="portfolio-overlay">
                            <h3>${escapeHtml(r.title)}</h3>
                            <p>${escapeHtml(meta)}</p>
                        </div>
                    </a>
                </div>`;
    })
    .join("");
}

function renderServiceDetailBlock(
  s: { slug: string; title: string; long_description: string | null; short_description: string | null; features: unknown; image_url: string | null; cta_label: string | null; cta_url: string | null },
  imageLeft: boolean,
): string {
  const desc = s.long_description ?? s.short_description ?? "";
  const feats = Array.isArray(s.features) ? (s.features as unknown[]).map(String) : [];
  const featuresHtml = feats
    .map((f) => `<li><i class="fas fa-check-circle"></i> ${escapeHtml(f)}</li>`)
    .join("");
  const img = s.image_url ?? "assets/images/placeholder.jpg";
  const ctaLabel = s.cta_label ?? "Learn More";
  const ctaUrl = s.cta_url ?? `/portfolio?filter=${encodeURIComponent(s.slug)}`;
  const shopUrl = `/shop?filter=${encodeURIComponent(s.slug)}`;
  const content = `
                <div class="service-content">
                    <h2>${escapeHtml(s.title)}</h2>
                    <p>${escapeHtml(desc)}</p>
                    ${featuresHtml ? `<ul class="service-features">${featuresHtml}</ul>` : ""}
                    <a href="${escapeHtml(ctaUrl)}" class="btn btn-primary">${escapeHtml(ctaLabel)}</a>
                    <a href="${escapeHtml(shopUrl)}" class="btn btn-secondary">Shop ${escapeHtml(s.title)}</a>
                </div>`;
  const image = `
                <div class="service-image">
                    <img src="${escapeHtml(img)}" alt="${escapeHtml(s.title)}">
                </div>`;
  const inner = imageLeft ? image + content : content + image;
  return `
            <div class="service" id="${escapeHtml(s.slug)}">${inner}
            </div>`;
}

function renderBlogCards(
  rows: Array<{ slug: string; title: string; excerpt: string | null; cover_image_url: string | null; category: string | null; published_at: string | null }>,
): string {
  if (!rows.length) return "";
  return rows
    .map((r, i) => {
      const featured = i === 0 ? " featured" : "";
      const badge = i === 0 ? `<div class="featured-badge">Featured</div>` : "";
      const date = r.published_at
        ? new Date(r.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "";
      const img = r.cover_image_url ?? "assets/images/placeholder.jpg";
      return `
                <article class="blog-card${featured}">
                    <div class="blog-image">
                        <img src="${escapeHtml(img)}" alt="${escapeHtml(r.title)}">
                        ${badge}
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span class="category">${escapeHtml(r.category ?? "")}</span>
                            <span class="date">${escapeHtml(date)}</span>
                        </div>
                        <h3><a href="/blog/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></h3>
                        <p>${escapeHtml(r.excerpt ?? "")}</p>
                        <a href="/blog/${escapeHtml(r.slug)}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>`;
    })
    .join("");
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents == null) return "";
  const amount = cents.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${escapeHtml(currency)} ${amount}`;
}

function renderProductCards(
  rows: Array<{ slug: string; title: string; description: string | null; image_url: string | null; images?: unknown; price_cents: number | null; currency: string; category: string | null; in_stock: boolean }>,
): string {
  if (!rows.length) return `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#666;">No products yet.</div>`;
  return rows
    .map((r) => {
      const imgs = pickImages(r.image_url, r.images);
      const cat = (r.category ?? "").toLowerCase();
      const price = formatPrice(r.price_cents, r.currency);
      return `
                <div class="product-card" data-category="${escapeHtml(cat)}" data-title="${escapeHtml((r.title || "").toLowerCase())}" data-desc="${escapeHtml((r.description || "").toLowerCase())}">
                    <div class="product-image">
                        ${rotatingImg(imgs, "assets/images/placeholder.jpg", r.title)}
                        ${r.in_stock ? "" : `<span class="out-of-stock">Out of stock</span>`}
                    </div>
                    <div class="product-info">
                        <h3>${escapeHtml(r.title)}</h3>
                        <p class="product-desc">${escapeHtml(r.description ?? "")}</p>
                        ${price ? `<p class="product-price">${price}</p>` : ""}
                        <a href="https://wa.me/254721499606?text=${encodeURIComponent(`Hello, I'm interested in ${r.title}`)}" target="_blank" class="quote-btn"><i class="fab fa-whatsapp"></i> Request Quote</a>
                    </div>
                </div>`;
    })
    .join("");
}

function renderTestimonials(
  rows: Array<{ name: string; company: string | null; review: string }>,
): string {
  return rows
    .map(
      (r, i) => `
                <div class="testimonial${i === 0 ? " active" : ""}">
                    <p>"${escapeHtml(r.review)}"</p>
                    <div class="client-info">
                        <h4>${escapeHtml(r.name)}</h4>
                        <p>${escapeHtml(r.company ?? "")}</p>
                    </div>
                </div>`,
    )
    .join("");
}

function renderTestimonialDots(count: number): string {
  return Array.from({ length: count })
    .map((_, i) => `<span class="dot${i === 0 ? " active" : ""}"></span>`)
    .join("");
}

function renderTeamMembers(
  rows: Array<{ name: string; position: string | null; bio: string | null; photo_url: string | null }>,
): string {
  return rows
    .map(
      (r) => `
                <div class="team-member">
                    <div class="member-image">
                        <img src="${escapeHtml(r.photo_url ?? "assets/images/placeholder.jpg")}" alt="${escapeHtml(r.name)}">
                    </div>
                    <h3>${escapeHtml(r.name)}</h3>
                    <p>${escapeHtml(r.position ?? "")}</p>
                    <p>${escapeHtml(r.bio ?? "")}</p>
                </div>`,
    )
    .join("");
}

// --- shared transforms ------------------------------------------------------

const SOCIAL_ICONS: Array<{ key: string; icon: string }> = [
  { key: "social_facebook", icon: "fab fa-facebook-f" },
  { key: "social_instagram", icon: "fab fa-instagram" },
  { key: "social_twitter", icon: "fab fa-twitter" },
  { key: "social_linkedin", icon: "fab fa-linkedin-in" },
  { key: "social_tiktok", icon: "fab fa-tiktok" },
];

function renderMenu(items: MenuItem[], activePath?: string): string {
  return items
    .map((it) => {
      const active =
        activePath &&
        (it.url === activePath ||
          (activePath !== "/" && it.url !== "/" && activePath.startsWith(it.url)));
      const attrs = it.open_in_new_tab ? ` target="_blank" rel="noopener"` : "";
      return `<li${active ? ' class="active"' : ""}><a href="${escapeHtml(it.url)}"${attrs}>${escapeHtml(it.label)}</a></li>`;
    })
    .join("");
}

function applyMenus(root: HTMLElement, ctx: SiteContext, activePath: string) {
  // Header nav
  const nav = root.querySelector("header nav ul");
  const primary = ctx.menus.get("primary");
  if (nav && primary && primary.length) {
    nav.set_content(renderMenu(primary, activePath));
  }

  // Footer columns
  const footer = root.querySelector("footer");
  if (!footer) return;
  const cols = footer.querySelectorAll(".footer-col");
  const quickLinks = ctx.menus.get("footer");
  const services = ctx.menus.get("footer_services");
  for (const col of cols) {
    const h3 = col.querySelector("h3");
    if (!h3) continue;
    const heading = (h3.text ?? "").trim().toLowerCase();
    const ul = col.querySelector("ul:not(.contact-info)");
    if (!ul) continue;
    if (heading.includes("quick") && quickLinks && quickLinks.length) {
      ul.set_content(renderMenu(quickLinks));
    } else if (heading === "services" && services && services.length) {
      ul.set_content(renderMenu(services));
    }
  }
}

function applyFooter(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;
  const footer = root.querySelector("footer");
  if (!footer) return;

  // Logo
  const logo = footer.querySelector("img.footer-logo");
  if (logo && s.footer_logo_url) logo.setAttribute("src", s.footer_logo_url);

  // Tagline (first <p> in the first footer-col)
  const firstCol = footer.querySelector(".footer-col");
  if (firstCol && s.footer_tagline) {
    const p = firstCol.querySelector("p");
    if (p) p.set_content(escapeHtml(s.footer_tagline));
  }

  // Contact info list
  const contactUl = footer.querySelector("ul.contact-info");
  if (contactUl && (s.contact_phone || s.contact_email || s.contact_address)) {
    const items: string[] = [];
    if (s.contact_phone)
      items.push(`<li><i class="fas fa-phone-alt"></i> ${escapeHtml(s.contact_phone)}</li>`);
    if (s.contact_email)
      items.push(`<li><i class="fas fa-envelope"></i> ${escapeHtml(s.contact_email)}</li>`);
    if (s.contact_address)
      items.push(`<li><i class="fas fa-map-marker-alt"></i> ${escapeHtml(s.contact_address)}</li>`);
    contactUl.set_content(items.join(""));
  }

  // Social links
  const social = footer.querySelector(".social-links");
  if (social) {
    const links = SOCIAL_ICONS.filter((s2) => !!s[s2.key])
      .map(
        (s2) =>
          `<a href="${escapeHtml(s[s2.key])}" target="_blank" rel="noopener"><i class="${s2.icon}"></i></a>`,
      )
      .join("");
    if (links) social.set_content(links);
  }

  // Bottom bar (copyright + credit)
  const bottom = footer.querySelector(".footer-bottom");
  if (bottom) {
    const paras = bottom.querySelectorAll("p");
    if (paras[0] && s.footer_copyright) {
      paras[0].set_content(escapeHtml(s.footer_copyright));
    }
    if (paras[1] && (s.footer_credit_label || s.footer_credit_url)) {
      const label = s.footer_credit_label || "Brandify Media";
      const url = s.footer_credit_url || "#";
      paras[1].set_content(
        `Made With <i class="fas fa-heart" style="color: #e25555;"></i> by <a href="${escapeHtml(url)}" target="_blank" style="color: #25D366; text-decoration: underline;">${escapeHtml(label)}</a>`,
      );
    }
  }
}

function applyHeaderLogo(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;
  if (!s.header_logo_url) return;
  const img = root.querySelector("header a.logo img");
  if (img) img.setAttribute("src", s.header_logo_url);
}

function applyLoadingOverlay(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;
  const overlay = root.querySelector("#loading-overlay .loading-content");
  if (!overlay) return;
  const paras = overlay.querySelectorAll("p.loading-text");
  if (paras[0] && s.loading_welcome_text) paras[0].set_content(escapeHtml(s.loading_welcome_text));
  if (paras[1] && s.loading_tagline) paras[1].set_content(escapeHtml(s.loading_tagline));
  const img = overlay.querySelector("img.heartbeat-logo");
  if (img && s.header_logo_url) img.setAttribute("src", s.header_logo_url);
}

function applyHero(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;
  const hero = root.querySelector("section.hero");
  if (!hero) return;
  const h1 = hero.querySelector("h1");
  if (h1 && s.hero_title) h1.set_content(escapeHtml(s.hero_title));
  const buttons = hero.querySelector(".hero-buttons");
  if (buttons) {
    const [primary, secondary] = buttons.querySelectorAll("a");
    if (primary && s.hero_cta_primary_label) {
      primary.set_content(escapeHtml(s.hero_cta_primary_label));
      if (s.hero_cta_primary_url) primary.setAttribute("href", s.hero_cta_primary_url);
    }
    if (secondary && s.hero_cta_secondary_label) {
      secondary.set_content(
        `<i class="fab fa-whatsapp"></i> ${escapeHtml(s.hero_cta_secondary_label)}`,
      );
      if (s.hero_cta_secondary_url) secondary.setAttribute("href", s.hero_cta_secondary_url);
    }
  }
  // Rewrite the hero background rotation script if present.
  const bgs = [s.hero_bg_1, s.hero_bg_2, s.hero_bg_3].filter(Boolean);
  if (bgs.length) {
    const scripts = root.querySelectorAll("script");
    for (const sc of scripts) {
      const txt = sc.text ?? "";
      if (txt.includes("hero-bg") && txt.includes("setInterval")) {
        sc.set_content(
          `\nconst hero = document.querySelector('.hero');\nconst images = ${JSON.stringify(bgs)};\nlet idx = 0;\nif (hero && images.length) { hero.style.backgroundImage = "url('" + images[0] + "')"; }\nif (hero && images.length > 1) {\n  setInterval(() => { idx = (idx + 1) % images.length; hero.style.backgroundImage = "url('" + images[idx] + "')"; }, 4000);\n}\n`,
        );
      }
    }
  }
}

function applyGoogleReview(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;
  const section = root.querySelector(".google-rating-section");
  if (!section) return;

  const summary = section.querySelector(".google-rating-summary p");
  if (summary && (s.google_rating_value || s.google_rating_count)) {
    const value = s.google_rating_value || "4.8";
    const count = s.google_rating_count || "";
    summary.set_content(
      `<strong>${escapeHtml(value)} ★★★★★</strong>${count ? ` based on ${escapeHtml(count)} Google reviews` : ""}`,
    );
  }
  const qr = section.querySelector(".google-rating-qr img");
  if (qr && s.google_qr_image_url) qr.setAttribute("src", s.google_qr_image_url);

  const reviewBtn = section.querySelector(".google-rating-button a");
  if (reviewBtn && s.google_review_url) reviewBtn.setAttribute("href", s.google_review_url);

  const progress = section.querySelector(".review-progress");
  if (progress && (s.google_reviews_current || s.google_reviews_goal)) {
    const cur = Number(s.google_reviews_current || "0");
    const goal = Number(s.google_reviews_goal || "0");
    const pct = goal > 0 ? Math.min(100, Math.round((cur / goal) * 100)) : 0;
    const label = progress.querySelector("p");
    if (label)
      label.set_content(
        `<strong>${escapeHtml(String(cur))} of ${escapeHtml(String(goal))}</strong> reviews reached – Help us grow!`,
      );
    const fill = progress.querySelector(".progress-fill");
    if (fill) fill.setAttribute("style", `width: ${pct}%;`);
  }
}

function applyGlobalWhatsApp(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;
  const num = s.whatsapp_number;
  const phone = s.contact_phone;
  const map = s.google_maps_url;
  if (!num && !phone && !map) return;

  const links = root.querySelectorAll("a");
  for (const a of links) {
    const href = a.getAttribute("href") ?? "";
    if (num && href.startsWith("https://wa.me/")) {
      // Preserve any ?text=... suffix
      const q = href.indexOf("?");
      const suffix = q >= 0 ? href.slice(q) : "";
      a.setAttribute("href", `https://wa.me/${num}${suffix}`);
    } else if (phone && href.startsWith("tel:")) {
      a.setAttribute("href", `tel:${phone.replace(/\s+/g, "")}`);
    } else if (
      map &&
      (href.startsWith("https://maps.app.goo.gl/") || href.startsWith("https://goo.gl/maps"))
    ) {
      a.setAttribute("href", map);
    }
  }
}

function applyMeta(root: HTMLElement, ctx: SiteContext, slug: string) {
  const p = ctx.pages.get(slug);
  if (!p) return;
  const title = p.seo_title ?? p.title;
  if (title) {
    setTitle(root, title);
    setMeta(root, "property", "og:title", title);
    setMeta(root, "name", "twitter:title", title);
  }
  if (p.meta_description) {
    setMeta(root, "name", "description", p.meta_description);
    setMeta(root, "property", "og:description", p.meta_description);
    setMeta(root, "name", "twitter:description", p.meta_description);
  }
  if (p.og_image_url) {
    setMeta(root, "property", "og:image", p.og_image_url);
    setMeta(root, "name", "twitter:image", p.og_image_url);
  }
  if (p.canonical_url) {
    const link = root.querySelector('link[rel="canonical"]');
    if (link) link.setAttribute("href", p.canonical_url);
  }
}

/**
 * Generic section-override renderer. Each page_sections row has a JSON
 * `content` object. Supported keys:
 *   - selector:  CSS selector to target (required)
 *   - html:      replace innerHTML entirely
 *   - title:     replace text of the first h1/h2/h3 under selector
 *   - body:      replace text of the first <p> under selector (or all <p>s if body_all)
 *   - image_url: replace src of the first <img> under selector
 *   - hide:      if truthy, hide the element (display:none)
 */
function applySectionOverrides(root: HTMLElement, overrides: SectionOverride[]) {
  for (const ov of overrides) {
    const c = ov.content ?? {};
    const selector = typeof c.selector === "string" ? c.selector : null;
    if (!selector) continue;
    const el = root.querySelector(selector);
    if (!el) continue;

    if (c.hide) {
      const existing = el.getAttribute("style") ?? "";
      el.setAttribute("style", `${existing};display:none`);
      continue;
    }
    if (typeof c.html === "string") {
      el.set_content(c.html);
      continue;
    }
    if (typeof c.title === "string") {
      const h = el.querySelector("h1, h2, h3");
      if (h) h.set_content(escapeHtml(c.title));
    }
    if (typeof c.body === "string") {
      const p = el.querySelector("p");
      if (p) p.set_content(escapeHtml(c.body));
    }
    if (typeof c.image_url === "string") {
      const img = el.querySelector("img");
      if (img) img.setAttribute("src", c.image_url);
    }
  }
}

// --- named page section handlers -------------------------------------------
// Structured content maps to specific slots on the live HTML.
// Content shape is per-section (see PageEditor specs).

type NamedContent = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

function applyHeroBlock(el: HTMLElement | null, c: NamedContent) {
  if (!el) return;
  const h1 = el.querySelector("h1, h2");
  if (h1 && str(c.title)) h1.set_content(escapeHtml(str(c.title)));
  const subs = el.querySelectorAll("p");
  if (subs[0] && str(c.subtitle)) subs[0].set_content(escapeHtml(str(c.subtitle)));
  if (str(c.image_url)) {
    const existing = el.getAttribute("style") ?? "";
    el.setAttribute(
      "style",
      `${existing};background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url('${str(c.image_url)}');background-size:cover;background-position:center;`,
    );
  }
}

function applyTitleBodyBlock(el: HTMLElement | null, c: NamedContent) {
  if (!el) return;
  const h = el.querySelector("h1, h2, h3");
  if (h && str(c.title)) h.set_content(escapeHtml(str(c.title)));
  const p = el.querySelector("p");
  if (p && str(c.body)) p.set_content(escapeHtml(str(c.body)));
}

function applyNamedSection(root: HTMLElement, slug: string, key: string, content: NamedContent) {
  const k = `${slug}:${key}`;
  switch (k) {
    // --- ABOUT ---
    case "about:hero":
      applyHeroBlock(root.querySelector(".page-header"), content);
      break;
    case "about:our_story": {
      const wrap = root.querySelector(".about-section .about-text");
      if (wrap) {
        const h2 = wrap.querySelector("h2");
        if (h2 && str(content.title)) h2.set_content(escapeHtml(str(content.title)));
        if (str(content.body)) {
          const paras = str(content.body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
          const existingPs = wrap.querySelectorAll("p");
          for (let i = 0; i < Math.min(paras.length, existingPs.length); i++) {
            existingPs[i].set_content(escapeHtml(paras[i]));
          }
        }
      }
      if (str(content.image_url)) {
        const img = root.querySelector(".about-section .about-image img");
        if (img) img.setAttribute("src", str(content.image_url));
      }
      if (str(content.badge_number) || str(content.badge_text)) {
        const badge = root.querySelector(".experience-badge");
        if (badge) {
          const span = badge.querySelector("span");
          const p = badge.querySelector("p");
          if (span && str(content.badge_number)) span.set_content(escapeHtml(str(content.badge_number)));
          if (p && str(content.badge_text)) p.set_content(escapeHtml(str(content.badge_text)));
        }
      }
      break;
    }
    case "about:mission_vision": {
      const wrap = root.querySelector(".mission-vision-values");
      if (!wrap) break;
      const title = wrap.querySelector("h2");
      if (title && str(content.title)) title.set_content(escapeHtml(str(content.title)));
      const mission = wrap.querySelector(".mission");
      if (mission) {
        const h = mission.querySelector("h3");
        const p = mission.querySelector("p");
        if (h && str(content.mission_title)) h.set_content(escapeHtml(str(content.mission_title)));
        if (p && str(content.mission_body)) p.set_content(escapeHtml(str(content.mission_body)));
      }
      const visions = wrap.querySelectorAll(".vision");
      const groups = [
        [str(content.vision_title), str(content.vision_body)],
        [str(content.objective_title), str(content.objective_body)],
      ];
      for (let i = 0; i < Math.min(visions.length, groups.length); i++) {
        const [t, b] = groups[i];
        const h = visions[i].querySelector("h3");
        const p = visions[i].querySelector("p");
        if (h && t) h.set_content(escapeHtml(t));
        if (p && b) p.set_content(escapeHtml(b));
      }
      break;
    }
    case "about:process": {
      const wrap = root.querySelector(".process-section");
      if (!wrap) break;
      const title = wrap.querySelector("h2");
      if (title && str(content.title)) title.set_content(escapeHtml(str(content.title)));
      const intro = wrap.querySelector("p:not(.process-summary)");
      if (intro && str(content.intro)) intro.set_content(escapeHtml(str(content.intro)));
      const summary = wrap.querySelector(".process-summary");
      if (summary && str(content.summary)) summary.set_content(escapeHtml(str(content.summary)));
      const steps = Array.isArray(content.steps) ? (content.steps as { title: string; body: string }[]) : [];
      if (steps.length) {
        const stepsWrap = wrap.querySelector(".process-steps");
        if (stepsWrap) {
          stepsWrap.set_content(
            steps.map((s) => `
              <div class="process-step">
                <span class="step-number"></span>
                <h3>${escapeHtml(s.title ?? "")}</h3>
                <p>${escapeHtml(s.body ?? "")}</p>
              </div>`).join(""),
          );
        }
      }
      break;
    }
    case "about:team_intro": {
      const wrap = root.querySelector(".team-section .container");
      if (wrap) {
        const h = wrap.querySelector("h2");
        const p = wrap.querySelector("p");
        if (h && str(content.title)) h.set_content(escapeHtml(str(content.title)));
        if (p && str(content.body)) p.set_content(escapeHtml(str(content.body)));
      }
      break;
    }

    // --- SERVICES ---
    case "services:hero":
      applyTitleBodyBlock(root.querySelector(".services-intro1 .container1"), content);
      if (str(content.image_url)) {
        applyHeroBlock(root.querySelector(".page-header"), { image_url: content.image_url });
      }
      break;
    case "services:what_we_offer":
      applyTitleBodyBlock(root.querySelector(".services-overview2 .container2"), content);
      break;
    case "services:cta_footer": {
      const wrap = root.querySelector("section.cta-section .container");
      if (wrap) {
        const h = wrap.querySelector("h2");
        const p = wrap.querySelector("p");
        if (h && str(content.title)) h.set_content(escapeHtml(str(content.title)));
        if (p && str(content.body)) p.set_content(escapeHtml(str(content.body)));
        const btn = wrap.querySelector(".cta-buttons a, .btn");
        if (btn) {
          if (str(content.cta_label)) btn.set_content(escapeHtml(str(content.cta_label)));
          if (str(content.cta_url)) btn.setAttribute("href", str(content.cta_url));
        }
      }
      break;
    }

    // --- PORTFOLIO ---
    case "portfolio:hero":
      applyHeroBlock(root.querySelector(".page-header"), content);
      break;
    case "portfolio:filters_intro": {
      // Optional intro text above filters — inject if placeholder missing
      break;
    }
    case "portfolio:cta_footer": {
      const wrap = root.querySelector("section.cta-section .container");
      if (wrap) {
        const h = wrap.querySelector("h2");
        const p = wrap.querySelector("p");
        if (h && str(content.title)) h.set_content(escapeHtml(str(content.title)));
        if (p && str(content.body)) p.set_content(escapeHtml(str(content.body)));
      }
      break;
    }

    // --- SHOP ---
    case "shop:hero":
      applyHeroBlock(root.querySelector(".page-header"), content);
      break;
    case "shop:featured":
      applyTitleBodyBlock(root.querySelector(".featured-products .container"), content);
      break;
    case "shop:all_products":
      applyTitleBodyBlock(root.querySelector(".introduction .container"), content);
      break;

    // --- BLOG ---
    case "blog:hero":
      applyHeroBlock(root.querySelector(".page-header"), content);
      break;
    case "blog:intro":
      applyTitleBodyBlock(root.querySelector(".blog-intro .container"), content);
      break;

    // --- CONTACT ---
    case "contact:hero":
      applyHeroBlock(root.querySelector(".page-header"), content);
      break;
    case "contact:intro":
      // Intro block — no explicit slot in default HTML; skip if none
      break;
    case "contact:details": {
      const info = root.querySelector(".contact-info");
      if (!info) break;
      const items = info.querySelectorAll(".info-item");
      // items[0] = Location, [1] = Phone, [2] = WhatsApp, [3] = Email, [4] = Hours
      if (items[0] && str(content.address)) {
        const div = items[0].querySelector("div");
        if (div) {
          const paras = div.querySelectorAll("p");
          const lines = str(content.address).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          for (let i = 0; i < Math.min(paras.length, lines.length); i++) {
            paras[i].set_content(escapeHtml(lines[i]));
          }
        }
      }
      if (items[1]) {
        const div = items[1].querySelector("div");
        if (div) {
          const paras = div.querySelectorAll("p");
          const phones = [str(content.phone), str(content.phone_2)].filter(Boolean);
          for (let i = 0; i < Math.min(paras.length, phones.length); i++) {
            paras[i].set_content(`<a href="tel:${escapeHtml(phones[i].replace(/\s+/g, ""))}">${escapeHtml(phones[i])}</a>`);
          }
        }
      }
      if (items[3]) {
        const div = items[3].querySelector("div");
        if (div) {
          const paras = div.querySelectorAll("p");
          const emails = [str(content.email), str(content.email_2)].filter(Boolean);
          for (let i = 0; i < Math.min(paras.length, emails.length); i++) {
            paras[i].set_content(`<a href="mailto:${escapeHtml(emails[i])}">${escapeHtml(emails[i])}</a>`);
          }
        }
      }
      if (str(content.map_embed_url)) {
        const iframe = root.querySelector(".map-container iframe");
        if (iframe) iframe.setAttribute("src", str(content.map_embed_url));
      }
      break;
    }
    case "contact:hours": {
      const info = root.querySelector(".contact-info");
      const items = info?.querySelectorAll(".info-item");
      const last = items && items[items.length - 1];
      if (last) {
        const div = last.querySelector("div");
        if (div) {
          const h3 = div.querySelector("h3");
          if (h3 && str(content.title)) h3.set_content(escapeHtml(str(content.title)));
          const rows = Array.isArray(content.items) ? (content.items as { day: string; hours: string }[]) : [];
          if (rows.length) {
            const oldP = div.querySelectorAll("p");
            for (const p of oldP) p.remove();
            for (const r of rows) {
              div.insertAdjacentHTML(
                "beforeend",
                `<p>${escapeHtml(r.day ?? "")}: ${escapeHtml(r.hours ?? "")}</p>`,
              );
            }
          }
        }
      }
      break;
    }
    case "contact:form": {
      const wrap = root.querySelector(".contact-form-section");
      if (wrap) {
        const h = wrap.querySelector("h2");
        const p = wrap.querySelector("p");
        if (h && str(content.title)) h.set_content(escapeHtml(str(content.title)));
        if (p && str(content.subtitle)) p.set_content(escapeHtml(str(content.subtitle)));
      }
      break;
    }
  }
}

async function applyCommon(root: HTMLElement, slug: string, activePath: string) {
  const version = await getContentVersion();
  const ctx = await loadSiteContext(version);
  applyMeta(root, ctx, slug);
  applyHeaderLogo(root, ctx);
  applyLoadingOverlay(root, ctx);
  applyMenus(root, ctx, activePath);
  applyGoogleReview(root, ctx);
  applyHero(root, ctx);
  applyGlobalWhatsApp(root, ctx);
  applyFooter(root, ctx);

  const pageMeta = ctx.pages.get(slug);
  if (pageMeta) {
    const overrides = await loadPageSections(version, pageMeta.id);
    if (overrides.length) {
      // Named sections first (structured), then generic selector overrides.
      for (const ov of overrides) {
        applyNamedSection(root, slug, ov.section_key, ov.content ?? {});
      }
      applySectionOverrides(root, overrides);
    }
  }
  return { ctx, version };
}

// --- per-page hydrators -----------------------------------------------------

// Inline SVG placeholder — replaces the missing /assets/images/placeholder.jpg
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect fill='%23e5e7eb' width='400' height='300'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'>Image</text></svg>`,
  );

// Rewrite image URLs at output time:
//   - `assets/foo.png` -> `/assets/foo.png` (legacy relative paths 404 on subpages)
//   - Supabase storage public URL for `admin-uploads` -> `/uploads/<path>` proxy
//   - Missing placeholder -> inline SVG
const AUTO_ROTATE_SCRIPT = `<script>(function(){function bind(img){if(img.dataset.rotateBound)return;img.dataset.rotateBound="1";var list;try{list=JSON.parse(img.getAttribute("data-images")||"[]")}catch(e){return}if(!list||list.length<2)return;var i=0;setInterval(function(){i=(i+1)%list.length;img.style.opacity="0";setTimeout(function(){img.src=list[i];img.style.opacity="1"},350)},3500)}function run(){document.querySelectorAll("img.auto-rotate").forEach(bind)}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",run)}else{run()}})();</script>`;
const SHOP_CONTROLS_SCRIPT = `<script>(function(){function init(){var grid=document.getElementById("productsContainer");var pag=document.getElementById("paginationContainer");var search=document.getElementById("searchInput");var sbtn=document.getElementById("searchBtn");var cat=document.getElementById("categoryFilter");if(!grid||!pag)return;var all=Array.prototype.slice.call(grid.querySelectorAll(".product-card"));if(!all.length)return;var PER=15;var page=1;var q="";var c="all";function match(card){var okC=(c==="all"||(card.getAttribute("data-category")||"")===c);if(!okC)return false;if(!q)return true;var t=card.getAttribute("data-title")||"";var d=card.getAttribute("data-desc")||"";return t.indexOf(q)>-1||d.indexOf(q)>-1}function render(){var filtered=all.filter(match);var total=filtered.length;var pages=Math.max(1,Math.ceil(total/PER));if(page>pages)page=pages;var start=(page-1)*PER;var end=start+PER;grid.innerHTML="";if(!total){var e=document.createElement("div");e.style.cssText="grid-column:1/-1;text-align:center;padding:2rem;color:#666;";e.textContent="No products match your search.";grid.appendChild(e)}else{filtered.slice(start,end).forEach(function(el){grid.appendChild(el)})}pag.innerHTML="";if(pages<=1){pag.style.display="none";return}pag.style.display="";function btn(label,p,dis,active){var b=document.createElement("button");b.type="button";b.className="page-btn"+(active?" active":"");b.textContent=label;b.disabled=!!dis;if(!dis){b.addEventListener("click",function(){page=p;render();grid.scrollIntoView({behavior:"smooth",block:"start"})})}pag.appendChild(b)}btn("‹ Prev",page-1,page<=1,false);var win=2;for(var i=1;i<=pages;i++){if(i===1||i===pages||(i>=page-win&&i<=page+win)){btn(String(i),i,false,i===page)}else if(i===page-win-1||i===page+win+1){var s=document.createElement("span");s.className="page-ellipsis";s.textContent="…";pag.appendChild(s)}}btn("Next ›",page+1,page>=pages,false);document.querySelectorAll("img.auto-rotate").forEach(function(img){if(!img.dataset.rotateBound&&window.__bindRotate)window.__bindRotate(img)})}function reset(){page=1;render()}if(search){search.addEventListener("input",function(){q=(search.value||"").toLowerCase().trim();reset()})}if(sbtn){sbtn.addEventListener("click",function(){q=(search?(search.value||""):"").toLowerCase().trim();reset()})}if(cat){cat.addEventListener("change",function(){c=cat.value||"all";reset()})}render()}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init)}else{init()}})();</script>`;

function postProcess(html: string): string {
  const rewritten = html
    .replace(
      /https?:\/\/[^"'\s)]+\/storage\/v1\/object\/public\/admin-uploads\/([^"'\s)]+)/g,
      "/uploads/$1",
    )
    .replace(
      /(src|href|poster)=("|')assets\//g,
      '$1=$2/assets/',
    )
    .replace(/url\((['"]?)assets\//g, "url($1/assets/")
    .replace(/assets\/images\/placeholder\.jpg/g, PLACEHOLDER_IMG);
  const needsRotate = rewritten.includes('class="auto-rotate"');
  const needsShop = rewritten.includes('id="productsContainer"');
  const inject = (needsRotate ? AUTO_ROTATE_SCRIPT : "") + (needsShop ? SHOP_CONTROLS_SCRIPT : "");
  if (!inject) return rewritten;
  if (rewritten.includes("</body>")) {
    return rewritten.replace("</body>", inject + "</body>");
  }
  return rewritten + inject;
}

async function safe(fn: () => Promise<HTMLElement>, fallback: string): Promise<string> {
  try {
    const root = await fn();
    return postProcess(root.toString());
  } catch (err) {
    console.error("[legacy-hydrate] failed:", err);
    return postProcess(fallback);
  }
}


export async function hydrateIndex(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    const { version } = await applyCommon(root, "home", "/");

    const services = await loadServices(version);
    if (services.length) setInner(root, ".services-grid", renderServiceCards(services));

    const portfolio = await loadPortfolio(version);
    if (portfolio.length) {
      const featured = portfolio.filter((p) => p.is_featured);
      const picks = (featured.length ? featured : portfolio).slice(0, 3);
      setInner(root, ".projects-grid", renderProjectCards(picks));
    }

    const testimonials = await loadTestimonials(version);
    if (testimonials.length) {
      setInner(root, ".testimonial-slider", renderTestimonials(testimonials));
      setInner(root, ".slider-dots", renderTestimonialDots(testimonials.length));
    }
    return root;
  }, html);
}

export async function hydrateServices(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    const { version } = await applyCommon(root, "services", "/services");
    const services = await loadServices(version);
    if (services.length) {
      setInner(root, "ul.service-list2", renderServiceListLinks(services));
      // Replace the "What We Offer" links to point at each slug anchor
      const container = root.querySelector(".services-detail .container");
      if (container) {
        container.set_content(
          services.map((s, i) => renderServiceDetailBlock(s, i % 2 === 1)).join(""),
        );
      }
    }
    return root;
  }, html);
}

export async function hydratePortfolio(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    const { version } = await applyCommon(root, "portfolio", "/portfolio");

    const portfolio = await loadPortfolio(version);
    if (portfolio.length) {
      setInner(root, ".portfolio-grid", renderPortfolioItems(portfolio));
      const cats = Array.from(
        new Set(
          portfolio
            .map((p) => (p.category ?? "").trim())
            .filter(Boolean)
            .map((c) => c.toLowerCase()),
        ),
      );
      if (cats.length) {
        const chips =
          `<button class="filter-btn active" data-filter="all">All Projects</button>` +
          cats
            .map(
              (c) =>
                `<button class="filter-btn" data-filter="${escapeHtml(c)}">${escapeHtml(c.charAt(0).toUpperCase() + c.slice(1))}</button>`,
            )
            .join("");
        setInner(root, ".portfolio-filter", chips);
      }
    }

    const testimonials = await loadTestimonials(version);
    if (testimonials.length) setInner(root, ".testimonial-slider", renderTestimonials(testimonials));
    return root;
  }, html);
}

export async function hydrateAbout(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    const { version } = await applyCommon(root, "about", "/about");
    const team = await loadTeam(version);
    if (team.length) setInner(root, ".team-grid", renderTeamMembers(team));
    return root;
  }, html);
}

function wireContactForm(root: HTMLElement) {
  const form = root.querySelector("form#contactForm");
  if (!form) return;
  form.setAttribute("action", "/api/public/contact");
  form.setAttribute("method", "POST");
  // Progressive-enhance: intercept and post JSON so we can show a toast.
  const head = root.querySelector("head");
  if (head && !root.querySelector("#contact-form-enhancer")) {
    head.insertAdjacentHTML(
      "beforeend",
      `\n<script id="contact-form-enhancer">
document.addEventListener('DOMContentLoaded', function(){
  var f = document.getElementById('contactForm');
  if (!f) return;
  f.addEventListener('submit', async function(e){
    e.preventDefault();
    var btn = f.querySelector('button[type="submit"]');
    var orig = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    try {
      var data = Object.fromEntries(new FormData(f).entries());
      var res = await fetch('/api/public/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Request failed');
      f.reset();
      alert('Thanks! We received your message and will get back to you shortly.');
    } catch (err) {
      alert('Sorry, we could not send your message. Please WhatsApp us instead.');
    } finally { if (btn) { btn.disabled = false; btn.textContent = orig; } }
  });
});
</script>`,
    );
  }
}

export async function hydrateContact(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "contact", "/contact");
    wireContactForm(root);
    return root;
  }, html);
}

export async function hydrateBlog(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    const { version } = await applyCommon(root, "blog", "/blog");
    const posts = await loadBlogPosts(version);
    if (posts.length) {
      setInner(root, ".blog-grid", renderBlogCards(posts));
    }
    return root;
  }, html);
}

export async function hydrateShop(html: string): Promise<string> {
  // Strip the legacy hardcoded shop.js — it overwrites CMS-rendered products
  // with static demo items on DOMContentLoaded.
  const cleaned = html.replace(
    /<script[^>]*src=["'][^"']*assets\/js\/shop\.js["'][^>]*><\/script>\s*/gi,
    "",
  );
  return safe(async () => {
    const root = parseDoc(cleaned);
    const { version } = await applyCommon(root, "shop", "/shop");
    const products = await loadShopProducts(version);
    if (products.length) {
      const featured = products.filter((p) => p.is_featured).slice(0, 6);
      setInner(root, "#featuredProductsContainer", renderProductCards(featured.length ? featured : products.slice(0, 3)));
      setInner(root, "#productsContainer", renderProductCards(products));
      const cats = Array.from(new Set(products.map((p) => (p.category ?? "").toLowerCase()).filter(Boolean))).sort();
      const options = [`<option value="all">All Categories</option>`]
        .concat(cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c.charAt(0).toUpperCase() + c.slice(1))}</option>`))
        .join("");
      setInner(root, "#categoryFilter", options);
    } else {
      setInner(root, "#featuredProductsContainer", renderProductCards([]));
      setInner(root, "#productsContainer", renderProductCards([]));
    }
    return root;
  }, html);
}
