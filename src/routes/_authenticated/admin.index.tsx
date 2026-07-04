import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Shachavir Timber CMS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { user } = Route.useRouteContext() as { user: { email?: string; id: string } };
  const [roles, setRoles] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => setRoles((data ?? []).map((r) => r.role)));
    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setMessageCount(count ?? 0));
  }, [user.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">CMS Admin</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {user.email} · roles: {roles.join(", ") || "user"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><a href="/">View site</a></Button>
            <Button onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Phase 1 complete</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your original site is live at every route (/, /about, /services, /portfolio, /blog, /shop, /contact).
            The CMS database, storage, auth, and admin gate are in place. Content-editing screens ship in Phase 2.
          </p>
          <ul className="mt-4 list-disc pl-6 text-sm space-y-1">
            <li>Contact messages: <strong>{messageCount ?? "…"}</strong></li>
            <li>Tables ready: pages, page_sections, services, portfolio_projects, testimonials, team_members, faqs, menus, menu_items, site_settings, media_assets.</li>
            <li>First user to sign in was automatically made admin.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Next: Phase 2</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask me to <em>"start Phase 2"</em> and I'll build the CRUD screens for every content type, media library, and rich text editor.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/">Back to site</Link>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
