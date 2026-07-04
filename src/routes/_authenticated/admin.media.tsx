import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaPage,
});

type Asset = {
  id: string;
  bucket: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  alt_text: string | null;
  created_at: string;
};

function MediaPage() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const q = useQuery({
    queryKey: ["media_assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
  });

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `library/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("admin-uploads")
          .upload(path, file);
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("media_assets").insert({
          bucket: "admin-uploads",
          storage_path: path,
          original_filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });
        if (insErr) throw insErr;
      }
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const del = useMutation({
    mutationFn: async (a: Asset) => {
      await supabase.storage.from(a.bucket).remove([a.storage_path]);
      const { error } = await supabase.from("media_assets").delete().eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    },
  });

  const publicUrl = (a: Asset) =>
    supabase.storage.from(a.bucket).getPublicUrl(a.storage_path).data.publicUrl;

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Media library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage images. Copy URLs to use in content fields.
          </p>
        </div>
        <label>
          <Input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button asChild disabled={uploading}>
            <span className="cursor-pointer">
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload
            </span>
          </Button>
        </label>
      </div>

      {q.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(q.data ?? []).map((a) => {
            const url = publicUrl(a);
            return (
              <Card key={a.id} className="p-2 space-y-2">
                <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
                  {a.mime_type?.startsWith("image/") ? (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{a.mime_type}</span>
                  )}
                </div>
                <div className="text-xs truncate" title={a.original_filename ?? ""}>
                  {a.original_filename}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast.success("URL copied");
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> URL
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this file?")) del.mutate(a);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
          {(q.data ?? []).length === 0 && (
            <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
              No files yet.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
