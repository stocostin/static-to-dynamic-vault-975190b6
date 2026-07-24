import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Image as ImageIcon,
  Star,
  Users,
  HelpCircle,
  FileText,
  Inbox,
  FileSpreadsheet,
  Newspaper,
  Settings,
  MessageCircle,
  Plus,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type StatDef = {
  key: string;
  label: string;
  icon: typeof LayoutIconType;
  to: string;
  tone: "brown" | "sand" | "olive" | "clay" | "slate" | "teal" | "gold";
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const LayoutIconType: typeof FileText;

const stats: StatDef[] = [
  { key: "pages", label: "Pages", icon: FileText, to: "/admin/pages/about", tone: "brown" },
  { key: "services", label: "Services", icon: Briefcase, to: "/admin/services", tone: "sand" },
  { key: "portfolio_projects", label: "Portfolio", icon: ImageIcon, to: "/admin/portfolio", tone: "olive" },
  { key: "testimonials", label: "Testimonials", icon: Star, to: "/admin/testimonials", tone: "gold" },
  { key: "team_members", label: "Team", icon: Users, to: "/admin/team", tone: "teal" },
  { key: "faqs", label: "FAQs", icon: HelpCircle, to: "/admin/faqs", tone: "slate" },
  { key: "contact_messages", label: "Messages", icon: Inbox, to: "/admin/messages", tone: "clay" },
];

const toneStyles: Record<StatDef["tone"], string> = {
  brown: "bg-[color:var(--admin-brown-soft)] text-[color:var(--admin-brown)]",
  sand: "bg-[color:var(--admin-gold-soft)] text-[color:var(--admin-gold-strong)]",
  olive: "bg-[oklch(0.7_0.09_130/0.18)] text-[oklch(0.42_0.09_130)]",
  clay: "bg-[oklch(0.7_0.12_45/0.18)] text-[oklch(0.42_0.12_45)]",
  slate: "bg-[oklch(0.7_0.02_260/0.18)] text-[oklch(0.42_0.02_260)]",
  teal: "bg-[oklch(0.7_0.08_190/0.18)] text-[oklch(0.42_0.08_190)]",
  gold: "bg-[color:var(--admin-gold-soft)] text-[color:var(--admin-gold-strong)]",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function AdminDashboard() {
  const counts = useQuery({
    queryKey: ["admin", "counts"],
    queryFn: async () => {
      const results: Record<string, number> = {};
      await Promise.all(
        stats.map(async (s) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { count } = await supabase.from(s.key as any).select("*", { count: "exact", head: true });
          results[s.key] = count ?? 0;
        }),
      );
      return results;
    },
  });

  const latestMessages = useQuery({
    queryKey: ["admin", "latest-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("id, name, subject, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const latestChats = useQuery({
    queryKey: ["admin", "latest-chats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, first_message, last_message, updated_at, is_read")
        .order("updated_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--admin-border)] bg-gradient-to-br from-[color:var(--admin-brown)] via-[oklch(0.36_0.055_50)] to-[color:var(--admin-brown)] text-white p-6 sm:p-8 shadow-md">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,oklch(0.68_0.12_75),transparent_60%)]" />
        <div className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-[color:var(--admin-gold)]/15 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-gold)]">
              Shachavir Timber · Admin Console
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-2">Welcome back</h1>
            <p className="text-sm text-white/75 mt-2 max-w-xl">
              Manage pages, documents, and inquiries in one place. Use the sidebar to jump into any section.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/50">Today</p>
            <p className="text-sm font-medium text-white/90">{today}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <div className="admin-eyebrow mb-3">At a glance</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.key} to={s.to} className="group">
                <div className="admin-card admin-card-hover p-4 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneStyles[s.tone]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[color:var(--admin-muted-fg)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-semibold tabular-nums font-serif text-[color:var(--admin-brown)]">
                      {counts.data?.[s.key] ?? "—"}
                    </div>
                    <div className="text-sm text-[color:var(--admin-muted-fg)] mt-0.5">{s.label}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="admin-eyebrow mb-3">Quick actions</div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-[color:var(--admin-brown)] hover:bg-[oklch(0.26_0.045_45)] text-white shadow-sm">
            <Link to="/admin/documents/new" search={{ type: "quotation" }}>
              <Plus className="h-4 w-4 mr-1.5" /> New quotation
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[color:var(--admin-border-strong)] text-[color:var(--admin-brown)] hover:bg-[color:var(--admin-gold-soft)]">
            <Link to="/admin/documents/new" search={{ type: "invoice" }}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> New invoice
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[color:var(--admin-border-strong)] text-[color:var(--admin-brown)] hover:bg-[color:var(--admin-gold-soft)]">
            <Link to="/admin/blog-posts">
              <Newspaper className="h-4 w-4 mr-1.5" /> New blog post
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[color:var(--admin-border-strong)] text-[color:var(--admin-brown)] hover:bg-[color:var(--admin-gold-soft)]">
            <Link to="/admin/portfolio">
              <ImageIcon className="h-4 w-4 mr-1.5" /> New project
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="text-[color:var(--admin-muted-fg)] hover:text-[color:var(--admin-brown)]">
            <Link to="/admin/settings">
              <Settings className="h-4 w-4 mr-1.5" /> Site settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Latest activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--admin-border)] bg-[color:var(--admin-bg)]">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[color:var(--admin-brown)]" />
              <h3 className="font-semibold text-sm text-[color:var(--admin-brown)]">Latest messages</h3>
            </div>
            <Link to="/admin/messages" className="text-xs text-[color:var(--admin-gold-strong)] hover:text-[color:var(--admin-brown)] font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[color:var(--admin-border)]">
            {(latestMessages.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-sm text-[color:var(--admin-muted-fg)]">No messages yet.</div>
            ) : (
              latestMessages.data!.map((m) => (
                <Link
                  key={m.id}
                  to="/admin/messages"
                  className="block px-4 py-3 hover:bg-[color:var(--admin-gold-soft)] transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-sm truncate text-[color:var(--admin-brown)]">{m.name || "Anonymous"}</span>
                    <span className="text-xs text-[color:var(--admin-muted-fg)] shrink-0">{timeAgo(m.created_at)}</span>
                  </div>
                  <p className="text-xs text-[color:var(--admin-muted-fg)] mt-0.5 line-clamp-1">
                    {m.subject || m.message}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--admin-border)] bg-[color:var(--admin-bg)]">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[color:var(--admin-brown)]" />
              <h3 className="font-semibold text-sm text-[color:var(--admin-brown)]">Latest chat inquiries</h3>
            </div>
            <Link to="/admin/chats" className="text-xs text-[color:var(--admin-gold-strong)] hover:text-[color:var(--admin-brown)] font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[color:var(--admin-border)]">
            {(latestChats.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-sm text-[color:var(--admin-muted-fg)]">No chat inquiries yet.</div>
            ) : (
              latestChats.data!.map((c) => (
                <Link
                  key={c.id}
                  to="/admin/chats"
                  className="block px-4 py-3 hover:bg-[color:var(--admin-gold-soft)] transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-sm truncate flex items-center gap-2 text-[color:var(--admin-brown)]">
                      Visitor
                      {!c.is_read && (
                        <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-[color:var(--admin-gold)]" />
                      )}
                    </span>
                    <span className="text-xs text-[color:var(--admin-muted-fg)] shrink-0">{timeAgo(c.updated_at)}</span>
                  </div>
                  <p className="text-xs text-[color:var(--admin-muted-fg)] mt-0.5 line-clamp-1">
                    {c.last_message || c.first_message || "—"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
