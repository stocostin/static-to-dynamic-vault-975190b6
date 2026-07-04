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

// --- 30s in-memory cache ----------------------------------------------------

type Entry<T> = { at: number; data: T };
const TTL = 30_000;
const cache = new Map<string, Entry<unknown>>();

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const data = await loader();
  cache.set(key, { at: Date.now(), data });
  return data;
}

// --- shared loaders ---------------------------------------------------------

type SiteContext = {
  settings: Record<string, string>;
  pages: Map<string, PageMeta>;
};

type PageMeta = {
  slug: string;
  title: string | null;
  seo_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
};

async function loadSiteContext(): Promise<SiteContext> {
  return cached("site-context", async () => {
    const c = sb();
    const [settings, pages] = await Promise.all([
      c.from("site_settings").select("key,value"),
      c
        .from("pages")
        .select(
          "slug,title,seo_title,meta_description,og_image_url,canonical_url",
        )
        .eq("is_published", true),
    ]);
    const s: Record<string, string> = {};
    for (const row of settings.data ?? []) {
      const v = row.value as unknown;
      s[row.key] = typeof v === "string" ? v : v == null ? "" : String(v);
    }
    const p = new Map<string, PageMeta>();
    for (const row of pages.data ?? []) p.set(row.slug, row as PageMeta);
    return { settings: s, pages: p };
  });
}

async function loadServices() {
  return cached("services", async () => {
    const { data } = await sb()
      .from("services")
      .select("slug,title,short_description,icon")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadPortfolio() {
  return cached("portfolio", async () => {
    const { data } = await sb()
      .from("portfolio_projects")
      .select("slug,title,client,category,cover_image_url,is_featured")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadTestimonials() {
  return cached("testimonials", async () => {
    const { data } = await sb()
      .from("testimonials")
      .select("name,company,review")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });
}

async function loadTeam() {
  return cached("team", async () => {
    const { data } = await sb()
      .from("team_members")
      .select("name,position,bio,photo_url")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
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

function renderProjectCards(
  rows: Array<{ title: string; client: string | null; cover_image_url: string | null }>,
): string {
  return rows
    .map(
      (r) => `
                <div class="project-card">
                    <img src="${escapeHtml(r.cover_image_url ?? "assets/images/placeholder.jpg")}" alt="${escapeHtml(r.title)}">
                    <div class="project-info">
                        <h3>${escapeHtml(r.title)}</h3>
                        <p>${escapeHtml(r.client ?? "")}</p>
                        <a href="/portfolio" class="btn-link">View More</a>
                    </div>
                </div>`,
    )
    .join("");
}

function renderPortfolioItems(
  rows: Array<{ title: string; client: string | null; category: string | null; cover_image_url: string | null }>,
): string {
  return rows
    .map((r) => {
      const cat = (r.category ?? "other").toLowerCase();
      const img = r.cover_image_url ?? "assets/images/placeholder.jpg";
      return `
                <div class="portfolio-item" data-category="${escapeHtml(cat)}">
                    <a href="${escapeHtml(img)}" data-lightbox="portfolio" data-title="${escapeHtml(r.title)}">
                        <img src="${escapeHtml(img)}" alt="${escapeHtml(r.title)}">
                        <div class="portfolio-overlay">
                            <h3>${escapeHtml(r.title)}</h3>
                            <p>${escapeHtml(r.client ?? "")}</p>
                        </div>
                    </a>
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

function applyFooter(root: HTMLElement, ctx: SiteContext) {
  const s = ctx.settings;

  // Footer contact-info list (in <footer> only)
  const footer = root.querySelector("footer");
  if (footer) {
    const contactUl = footer.querySelector("ul.contact-info");
    if (contactUl && (s.contact_phone || s.contact_email || s.contact_address)) {
      const items: string[] = [];
      if (s.contact_phone)
        items.push(
          `<li><i class="fas fa-phone-alt"></i> ${escapeHtml(s.contact_phone)}</li>`,
        );
      if (s.contact_email)
        items.push(
          `<li><i class="fas fa-envelope"></i> ${escapeHtml(s.contact_email)}</li>`,
        );
      if (s.contact_address)
        items.push(
          `<li><i class="fas fa-map-marker-alt"></i> ${escapeHtml(s.contact_address)}</li>`,
        );
      contactUl.set_content(items.join(""));
    }

    // Footer social-links
    const social = footer.querySelector(".social-links");
    if (social) {
      const links = SOCIAL_ICONS.filter((s2) => s.[s2.key] && s[s2.key])
        .map(
          (s2) =>
            `<a href="${escapeHtml(s[s2.key])}" target="_blank" rel="noopener"><i class="${s2.icon}"></i></a>`,
        )
        .join("");
      if (links) social.set_content(links);
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

async function applyCommon(root: HTMLElement, slug: string) {
  const ctx = await loadSiteContext();
  applyMeta(root, ctx, slug);
  applyFooter(root, ctx);
}

// --- per-page hydrators -----------------------------------------------------

async function safe(fn: () => Promise<HTMLElement>, fallback: string): Promise<string> {
  try {
    const root = await fn();
    return root.toString();
  } catch (err) {
    // If DB is unreachable, serve original page untouched.
    console.error("[legacy-hydrate] failed:", err);
    return fallback;
  }
}

export async function hydrateIndex(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "home");

    const services = await loadServices();
    if (services.length) {
      setInner(root, ".services-grid", renderServiceCards(services));
    }

    const portfolio = await loadPortfolio();
    if (portfolio.length) {
      const featured = portfolio.filter((p) => p.is_featured);
      const picks = (featured.length ? featured : portfolio).slice(0, 3);
      setInner(root, ".projects-grid", renderProjectCards(picks));
    }

    const testimonials = await loadTestimonials();
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
    await applyCommon(root, "services");

    const services = await loadServices();
    if (services.length) {
      setInner(root, "ul.service-list2", renderServiceListLinks(services));
    }
    return root;
  }, html);
}

export async function hydratePortfolio(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "portfolio");

    const portfolio = await loadPortfolio();
    if (portfolio.length) {
      setInner(root, ".portfolio-grid", renderPortfolioItems(portfolio));

      // Filter chips: derive from distinct categories
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
                `<button class="filter-btn" data-filter="${escapeHtml(c)}">${escapeHtml(
                  c.charAt(0).toUpperCase() + c.slice(1),
                )}</button>`,
            )
            .join("");
        setInner(root, ".portfolio-filter", chips);
      }
    }

    const testimonials = await loadTestimonials();
    if (testimonials.length) {
      setInner(root, ".testimonial-slider", renderTestimonials(testimonials));
    }

    return root;
  }, html);
}

export async function hydrateAbout(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "about");

    const team = await loadTeam();
    if (team.length) {
      setInner(root, ".team-grid", renderTeamMembers(team));
    }
    return root;
  }, html);
}

export async function hydrateContact(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "contact");
    return root;
  }, html);
}

export async function hydrateBlog(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "blog");
    return root;
  }, html);
}

export async function hydrateShop(html: string): Promise<string> {
  return safe(async () => {
    const root = parseDoc(html);
    await applyCommon(root, "shop");
    return root;
  }, html);
}
