import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

type Key = { key: string; label: string; type?: "text" | "textarea"; help?: string };

const GROUPS: { id: string; label: string; keys: Key[] }[] = [
  {
    id: "brand",
    label: "Branding",
    keys: [
      { key: "site_name", label: "Site name" },
      { key: "site_tagline", label: "Site tagline" },
      { key: "header_logo_url", label: "Header logo URL" },
      { key: "footer_logo_url", label: "Footer logo URL" },
      { key: "loading_welcome_text", label: "Loading screen — welcome text" },
      { key: "loading_tagline", label: "Loading screen — tagline" },
    ],
  },
  {
    id: "hero",
    label: "Home hero",
    keys: [
      { key: "hero_title", label: "Hero title" },
      { key: "hero_subtitle", label: "Hero subtitle" },
      { key: "hero_bg_1", label: "Hero background image 1" },
      { key: "hero_bg_2", label: "Hero background image 2" },
      { key: "hero_bg_3", label: "Hero background image 3" },
      { key: "hero_cta_primary_label", label: "Primary button label" },
      { key: "hero_cta_primary_url", label: "Primary button URL" },
      { key: "hero_cta_secondary_label", label: "Secondary button label" },
      { key: "hero_cta_secondary_url", label: "Secondary button URL" },
    ],
  },
  {
    id: "contact",
    label: "Contact & social",
    keys: [
      { key: "contact_email", label: "Contact email" },
      { key: "contact_phone", label: "Contact phone" },
      { key: "contact_address", label: "Contact address", type: "textarea" },
      { key: "whatsapp_number", label: "WhatsApp number (digits only, e.g. 254721499606)" },
      { key: "whatsapp_default_message", label: "WhatsApp default message" },
      { key: "google_maps_url", label: "Google Maps URL" },
      { key: "social_facebook", label: "Facebook URL" },
      { key: "social_instagram", label: "Instagram URL" },
      { key: "social_tiktok", label: "TikTok URL" },
      { key: "social_twitter", label: "Twitter URL" },
      { key: "social_linkedin", label: "LinkedIn URL" },
    ],
  },
  {
    id: "reviews",
    label: "Google reviews",
    keys: [
      { key: "google_review_url", label: "Review URL" },
      { key: "google_rating_value", label: "Rating value (e.g. 4.8)" },
      { key: "google_rating_count", label: "Rating count label (e.g. 120+)" },
      { key: "google_reviews_current", label: "Current review count" },
      { key: "google_reviews_goal", label: "Review goal" },
      { key: "google_qr_image_url", label: "QR code image URL" },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    keys: [
      { key: "footer_tagline", label: "Footer tagline" },
      { key: "footer_copyright", label: "Copyright line" },
      { key: "footer_credit_label", label: "Credit label" },
      { key: "footer_credit_url", label: "Credit URL" },
    ],
  },
  {
    id: "seo",
    label: "SEO defaults",
    keys: [
      { key: "default_meta_description", label: "Default meta description", type: "textarea" },
      { key: "google_analytics_id", label: "Google Analytics ID" },
    ],
  },
];

const ALL_KEYS = GROUPS.flatMap((g) => g.keys);

function SettingsPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (q.data) {
      const map: Record<string, string> = {};
      for (const row of q.data) {
        const v = row.value as unknown;
        map[row.key] = typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
      }
      setValues(map);
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = ALL_KEYS.map((s) => ({
        key: s.key,
        value: values[s.key] ?? "",
      }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved. Changes appear on the live site within a few seconds.");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Site settings</h1>
          <p className="text-sm text-muted-foreground">
            Global values used across the public site.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/" target="_blank" rel="noreferrer">Open live site</a>
        </Button>
      </div>

      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Card className="p-6">
          <Tabs defaultValue={GROUPS[0].id}>
            <TabsList className="flex-wrap h-auto">
              {GROUPS.map((g) => (
                <TabsTrigger key={g.id} value={g.id}>{g.label}</TabsTrigger>
              ))}
            </TabsList>
            {GROUPS.map((g) => (
              <TabsContent key={g.id} value={g.id} className="space-y-4 mt-4">
                {g.keys.map((s) => (
                  <div key={s.key} className="space-y-1.5">
                    <Label>{s.label}</Label>
                    {s.type === "textarea" ? (
                      <Textarea
                        rows={3}
                        value={values[s.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      />
                    ) : (
                      <Input
                        value={values[s.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      />
                    )}
                    {s.help && <p className="text-xs text-muted-foreground">{s.help}</p>}
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
          <div className="pt-6">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save settings
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
