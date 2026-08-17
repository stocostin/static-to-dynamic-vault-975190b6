import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ShachavirAssistant } from "@/components/ShachavirAssistant";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shachavir Timber Limited — Premium Woodwork in Kenya" },
      {
        name: "description",
        content:
          "Shachavir Timber Limited crafts custom doors, frames, staircases and bespoke furniture in Kenya using premium hardwoods and expert joinery.",
      },
      { property: "og:site_name", content: "Shachavir Timber Limited" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Shachavir Timber Limited — Premium Woodwork in Kenya" },
      {
        property: "og:description",
        content:
          "Shachavir Timber Limited crafts custom doors, frames, staircases and bespoke furniture in Kenya using premium hardwoods and expert joinery.",
      },
      { property: "og:image", content: "https://shachavirtimber.com/assets/images/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shachavir Timber Limited — Premium Woodwork in Kenya" },
      {
        name: "twitter:description",
        content:
          "Shachavir Timber Limited crafts custom doors, frames, staircases and bespoke furniture in Kenya using premium hardwoods and expert joinery.",
      },
      { name: "twitter:image", content: "https://shachavirtimber.com/assets/images/logo.png" },
      { name: "google-site-verification", content: "Xv-zdmEIYKqoW_sKlMzkd6Q3WqQi8QaMJxaDML1qcGI" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://shachavirtimber.com/#organization",
              name: "Shachavir Timber Limited",
              url: "https://shachavirtimber.com/",
              logo: "https://shachavirtimber.com/assets/images/logo.png",
              description:
                "Shachavir Timber Limited crafts custom doors, frames, staircases and bespoke furniture in Kenya using premium hardwoods and expert joinery.",
              areaServed: "KE",
            },
            {
              "@type": "LocalBusiness",
              "@id": "https://shachavirtimber.com/#localbusiness",
              name: "Shachavir Timber Limited",
              url: "https://shachavirtimber.com/",
              image: "https://shachavirtimber.com/assets/images/logo.png",
              logo: "https://shachavirtimber.com/assets/images/logo.png",
              telephone: "+254721499606",
              parentOrganization: { "@id": "https://shachavirtimber.com/#organization" },
              address: {
                "@type": "PostalAddress",
                streetAddress: "Ruai Bypass",
                addressLocality: "Nairobi",
                addressCountry: "KE",
              },
              areaServed: "KE",
              priceRange: "$$",
            },
            {
              "@type": "WebSite",
              "@id": "https://shachavirtimber.com/#website",
              url: "https://shachavirtimber.com/",
              name: "Shachavir Timber Limited",
              publisher: { "@id": "https://shachavirtimber.com/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <ShachavirAssistant />
      <Toaster />
    </QueryClientProvider>
  );
}
