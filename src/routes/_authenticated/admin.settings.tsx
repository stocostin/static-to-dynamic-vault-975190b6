import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const SETTING_KEYS: { key: string; label: string; type?: "text" | "textarea" }[] = [
  { key: "site_name", label: "Site name" },
  { key: "site_tagline", label: "Site tagline" },
  { key: "contact_email", label: "Contact email" },
  { key: "contact_phone", label: "Contact phone" },
  { key: "contact_address", label: "Contact address", type: "textarea" },
  { key: "social_facebook", label: "Facebook URL" },
  { key: "social_instagram", label: "Instagram URL" },
  { key: "social_twitter", label: "Twitter URL" },
  { key: "social_linkedin", label: "LinkedIn URL" },
  { key: "google_analytics_id", label: "Google Analytics ID" },
  { key: "default_meta_description", label: "Default meta description", type: "textarea" },
];

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
      const rows = SETTING_KEYS.map((s) => ({
        key: s.key,
        value: values[s.key] ?? "",
      }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Site settings</h1>
      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Card className="p-6 space-y-4">
          {SETTING_KEYS.map((s) => (
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
            </div>
          ))}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save settings
          </Button>
        </Card>
      )}
    </div>
  );
}
