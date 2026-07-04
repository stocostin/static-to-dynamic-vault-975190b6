import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getSiteChrome } from "@/lib/site.functions";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import type { ReactNode } from "react";

export const siteChromeQuery = queryOptions({
  queryKey: ["site-chrome"],
  queryFn: () => getSiteChrome(),
  staleTime: 60_000,
});

export function SiteShell({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(siteChromeQuery);
  const { settings, primaryMenu, footerMenu } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-lg font-bold tracking-tight">
            {settings.site_name || "Shachavir Timber"}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {primaryMenu.map((item) => (
              <a key={item.url} href={item.url} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="/contact"
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start a project
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 bg-muted/30 mt-24">
        <div className="mx-auto max-w-6xl px-4 py-14 grid gap-10 md:grid-cols-4 text-sm">
          <div className="space-y-3 md:col-span-2">
            <div className="font-serif text-lg font-bold">{settings.site_name || "Shachavir Timber"}</div>
            <p className="text-muted-foreground max-w-sm">{settings.site_tagline}</p>
            <div className="flex gap-3 pt-2">
              {settings.social_facebook && (
                <a href={settings.social_facebook} aria-label="Facebook" className="text-muted-foreground hover:text-foreground">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Explore</div>
            <ul className="space-y-1.5">
              {footerMenu.map((item) => (
                <li key={item.url}>
                  <a href={item.url} className="text-muted-foreground hover:text-foreground">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Contact</div>
            <ul className="space-y-1.5 text-muted-foreground">
              {settings.contact_email && (
                <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5" /><a href={`mailto:${settings.contact_email}`} className="hover:text-foreground">{settings.contact_email}</a></li>
              )}
              {settings.contact_phone && (
                <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5" /><a href={`tel:${settings.contact_phone.replace(/\s+/g,'')}`} className="hover:text-foreground">{settings.contact_phone}</a></li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /><span>{settings.contact_address}</span></li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings.site_name || "Shachavir Timber Limited"}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {image && (
        <div className="absolute inset-0">
          <img src={image} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        </div>
      )}
      <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">{eyebrow}</div>
        )}
        <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
