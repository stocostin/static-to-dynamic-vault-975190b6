import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Image as ImageIcon,
  Users,
  MessageSquare,
  HelpCircle,
  Settings,
  Menu as MenuIcon,
  Inbox,
  LogOut,
  Star,
  Globe,
} from "lucide-react";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/portfolio", label: "Portfolio", icon: ImageIcon },
  { to: "/admin/testimonials", label: "Testimonials", icon: Star },
  { to: "/admin/team", label: "Team", icon: Users },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/menus", label: "Menus", icon: MenuIcon },
  { to: "/admin/messages", label: "Messages", icon: Inbox },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  { to: "/admin/settings", label: "Site Settings", icon: Settings },
];


export function AdminShell() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="px-5 py-4 border-b">
          <Link to="/admin" className="text-base font-semibold">
            Shachavir CMS
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t space-y-1">
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <a href="/" target="_blank" rel="noreferrer">
              <Globe className="h-4 w-4 mr-2" /> View site
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
