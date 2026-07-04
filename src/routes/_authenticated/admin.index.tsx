import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  Image as ImageIcon,
  Star,
  Users,
  HelpCircle,
  FileText,
  Inbox,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const stats = [
  { key: "pages", label: "Pages", icon: FileText },
  { key: "services", label: "Services", icon: Briefcase },
  { key: "portfolio_projects", label: "Portfolio", icon: ImageIcon },
  { key: "testimonials", label: "Testimonials", icon: Star },
  { key: "team_members", label: "Team", icon: Users },
  { key: "faqs", label: "FAQs", icon: HelpCircle },
  { key: "contact_messages", label: "Messages", icon: Inbox },
] as const;

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

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your content. Use the sidebar to manage each section.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold mt-2">
                {counts.data?.[s.key] ?? "—"}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
