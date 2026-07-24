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

const toneStyles: Record<StatDef["tone"], { bg: string; fg: string }> = {
  brown: { bg: "bg-[#6F4E37]/10", fg: "text-[#6F4E37]" },
  sand: { bg: "bg-[#C9A96E]/15", fg: "text-[#8B6B2E]" },
  olive: { bg: "bg-[#6B8E4E]/15", fg: "text-[#4F6B3A]" },
  clay: { bg: "bg-[#B5651D]/15", fg: "text-[#8B4A15]" },
  slate: { bg: "bg-slate-500/10", fg: "text-slate-700" },
  teal: { bg: "bg-teal-600/10", fg: "text-teal-700" },
  gold: { bg: "bg-amber-500/15", fg: "text-amber-700" },
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
        .select("id, visitor_name, last_message_preview, updated_at, unread_count")
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
    <div className="p-4 sm:p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-[#6F4E37] via-[#8B6749] to-[#6F4E37] text-white p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Shachavir Timber · Admin</p>
            <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Welcome back</h1>
            <p className="text-sm text-white/80 mt-2 max-w-lg">
              Manage pages, documents, and inquiries. Use the sidebar to jump into any section.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-white/60">Today</p>
            <p className="text-sm font-medium">{today}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          At a glance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            const t = toneStyles[s.tone];
            return (
              <Link key={s.key} to={s.to} className="group">
                <Card className="p-4 h-full hover:shadow-md hover:-translate-y-0.5 transition-all border-border/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${t.bg} ${t.fg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-semibold tabular-nums text-foreground">
                      {counts.data?.[s.key] ?? "—"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-[#6F4E37] hover:bg-[#5a3f2c] text-white">
            <Link to="/admin/documents/new" search={{ type: "quotation" }}>
              <Plus className="h-4 w-4 mr-1.5" /> New quotation
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/documents/new" search={{ type: "invoice" }}>
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> New invoice
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/blog-posts">
              <Newspaper className="h-4 w-4 mr-1.5" /> New blog post
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/portfolio">
              <ImageIcon className="h-4 w-4 mr-1.5" /> New project
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/settings">
              <Settings className="h-4 w-4 mr-1.5" /> Site settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Latest activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#6F4E37]" />
              <h3 className="font-semibold text-sm">Latest messages</h3>
            </div>
            <Link to="/admin/messages" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="divide-y">
            {(latestMessages.data ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              latestMessages.data!.map((m) => (
                <Link
                  key={m.id}
                  to="/admin/messages"
                  className="block px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-sm truncate">{m.name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(m.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {m.subject || m.message}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#6F4E37]" />
              <h3 className="font-semibold text-sm">Latest chat inquiries</h3>
            </div>
            <Link to="/admin/chats" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="divide-y">
            {(latestChats.data ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No chat inquiries yet.</div>
            ) : (
              latestChats.data!.map((c) => (
                <Link
                  key={c.id}
                  to="/admin/chats"
                  className="block px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-sm truncate flex items-center gap-2">
                      {c.visitor_name || "Visitor"}
                      {c.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#6F4E37] text-white text-[10px] font-semibold">
                          {c.unread_count}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(c.updated_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {c.last_message_preview || "—"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
