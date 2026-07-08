import { useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Image as ImageIcon,
  Users,
  HelpCircle,
  Settings,
  Menu as MenuIcon,
  Inbox,
  LogOut,
  Star,
  Globe,
  Newspaper,
  ShoppingBag,
  Info,
  Wrench,
  Layers,
  Phone,
  MessageCircle,
  FileSpreadsheet,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Documents",
    items: [
      { to: "/admin/documents", label: "Invoices & quotations", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Pages",
    items: [
      { to: "/admin/pages/about", label: "About page", icon: Info },
      { to: "/admin/pages/services", label: "Services page", icon: Wrench },
      { to: "/admin/pages/portfolio", label: "Portfolio page", icon: Layers },
      { to: "/admin/pages/shop", label: "Shop page", icon: ShoppingBag },
      { to: "/admin/pages/blog", label: "Blog page", icon: Newspaper },
      { to: "/admin/pages/contact", label: "Contact page", icon: Phone },
    ],
  },
  {
    label: "Collections",
    items: [
      { to: "/admin/services", label: "Services", icon: Briefcase },
      { to: "/admin/portfolio", label: "Portfolio projects", icon: ImageIcon },
      { to: "/admin/shop-products", label: "Shop products", icon: ShoppingBag },
      { to: "/admin/blog-posts", label: "Blog posts", icon: Newspaper },
      { to: "/admin/testimonials", label: "Testimonials", icon: Star },
      { to: "/admin/team", label: "Team", icon: Users },
      { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { to: "/admin/menus", label: "Menus", icon: MenuIcon },
      { to: "/admin/menu-items", label: "Menu items", icon: MenuIcon },
      { to: "/admin/messages", label: "Messages", icon: Inbox },
      { to: "/admin/chats", label: "Chat inquiries", icon: MessageCircle },
      { to: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/admin/settings", label: "Site settings", icon: Settings },
      { to: "/admin/pages", label: "Page SEO", icon: FileText },
      { to: "/admin/page-sections", label: "Advanced sections", icon: FileText },
      { to: "/admin/legacy-images", label: "Legacy images", icon: ImageIcon },
    ],
  },
];

function NavContent({ pathname, onNavigate, onSignOut }: { pathname: string; onNavigate?: () => void; onSignOut: () => void }) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto p-2 space-y-3">
        {groups.map((g) => (
          <div key={g.label} className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </div>
            {g.items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-2 border-t space-y-1">
        <Button asChild variant="ghost" size="sm" className="w-full justify-start">
          <a href="/" target="_blank" rel="noreferrer">
            <Globe className="h-4 w-4 mr-2" /> View site
          </a>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </>
  );
}

export function AdminShell() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 border-r bg-card flex-col shrink-0">
        <div className="px-5 py-4 border-b">
          <Link to="/admin" className="text-base font-semibold">
            Shachavir CMS
          </Link>
        </div>
        <NavContent pathname={pathname} onSignOut={signOut} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 border-b bg-card px-3 py-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="px-5 py-4 border-b">
                <SheetTitle className="text-left text-base">Shachavir CMS</SheetTitle>
              </SheetHeader>
              <NavContent pathname={pathname} onNavigate={() => setOpen(false)} onSignOut={signOut} />
            </SheetContent>
          </Sheet>
          <Link to="/admin" className="text-sm font-semibold truncate">
            Shachavir CMS
          </Link>
        </header>

        <main className="flex-1 overflow-x-hidden min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
