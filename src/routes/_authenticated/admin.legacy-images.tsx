// Temporary Phase-1 admin tool: bulk upload the original static-site images
// and drop them into the private `admin-uploads` bucket at their expected
// relative paths. Served back at /assets/images/* by src/routes/assets.images.$.tsx.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  LEGACY_IMAGE_PATHS,
  LEGACY_STORAGE_PREFIX,
} from "@/lib/legacy-images";

export const Route = createFileRoute("/_authenticated/admin/legacy-images")({
  head: () => ({
    meta: [
      { title: "Legacy images — Shachavir CMS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LegacyImagesPage,
});

type Pending = { path: string; file: File };

// Recursively list every object under the legacy prefix.
async function listUploaded(): Promise<Set<string>> {
  const found = new Set<string>();
  const walk = async (sub: string) => {
    const { data, error } = await supabase.storage
      .from("admin-uploads")
      .list(LEGACY_STORAGE_PREFIX + sub, { limit: 1000 });
    if (error) throw error;
    for (const item of data ?? []) {
      // A folder has no `id` (metadata is null).
      if ((item as { id: string | null }).id === null) {
        await walk(sub + item.name + "/");
      } else {
        found.add(sub + item.name);
      }
    }
  };
  await walk("");
  return found;
}

function LegacyImagesPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Record<string, File>>({});
  const [unmatched, setUnmatched] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadedQ = useQuery({
    queryKey: ["legacy-images-uploaded"],
    queryFn: listUploaded,
  });

  const uploaded = uploadedQ.data ?? new Set<string>();

  const stats = useMemo(() => {
    let done = 0;
    for (const p of LEGACY_IMAGE_PATHS) if (uploaded.has(p)) done += 1;
    return { done, total: LEGACY_IMAGE_PATHS.length };
  }, [uploaded]);

  const remainingPaths = useMemo(
    () => LEGACY_IMAGE_PATHS.filter((p) => !(p in pending)),
    [pending],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const nextPending = { ...pending };
    const nextUnmatched = [...unmatched];
    for (const file of Array.from(files)) {
      // webkitRelativePath is present for folder uploads.
      const relRaw =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        "";
      const rel = relRaw.replace(/\\/g, "/");
      // Try to find "assets/images/<rest>" in the relative path.
      const idx = rel.toLowerCase().indexOf("assets/images/");
      let matched: string | null = null;
      if (idx >= 0) {
        const sub = rel.slice(idx + "assets/images/".length);
        if ((LEGACY_IMAGE_PATHS as readonly string[]).includes(sub)) {
          matched = sub;
        }
      }
      if (!matched) {
        // Fallback: basename match (must be unique).
        const base = file.name;
        const hits = LEGACY_IMAGE_PATHS.filter((p) => p.endsWith("/" + base) || p === base);
        if (hits.length === 1) matched = hits[0];
      }
      if (matched) {
        nextPending[matched] = file;
      } else {
        nextUnmatched.push(file);
      }
    }
    setPending(nextPending);
    setUnmatched(nextUnmatched);
  };

  const assignUnmatched = (idx: number, path: string) => {
    const file = unmatched[idx];
    setUnmatched(unmatched.filter((_, i) => i !== idx));
    setPending({ ...pending, [path]: file });
  };

  const clearPending = (path: string) => {
    const next = { ...pending };
    delete next[path];
    setPending(next);
  };

  const uploadAll = async () => {
    const entries = Object.entries(pending);
    if (!entries.length) {
      toast.error("Nothing to upload");
      return;
    }
    setUploading(true);
    let ok = 0;
    let fail = 0;
    for (const [path, file] of entries) {
      const { error } = await supabase.storage
        .from("admin-uploads")
        .upload(LEGACY_STORAGE_PREFIX + path, file, {
          upsert: true,
          contentType: file.type || undefined,
        });
      if (error) {
        fail += 1;
        toast.error(`${path}: ${error.message}`);
      } else {
        ok += 1;
      }
    }
    setUploading(false);
    setPending({});
    qc.invalidateQueries({ queryKey: ["legacy-images-uploaded"] });
    toast.success(`Uploaded ${ok} file${ok === 1 ? "" : "s"}${fail ? `, ${fail} failed` : ""}`);
  };

  const deleteOne = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;
    const { error } = await supabase.storage
      .from("admin-uploads")
      .remove([LEGACY_STORAGE_PREFIX + path]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["legacy-images-uploaded"] });
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Legacy images (temporary)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drop the original <code>assets/images</code> folder here (or select
          individual files). Files are matched to their expected paths by folder
          structure or filename, then served back at{" "}
          <code>/assets/images/…</code> so the legacy pages render correctly.
        </p>
        <p className="text-sm mt-2">
          <strong>{stats.done}</strong> of <strong>{stats.total}</strong> expected
          images uploaded.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => folderInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" /> Select folder
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" /> Select files
          </Button>
          <Button
            onClick={uploadAll}
            disabled={uploading || Object.keys(pending).length === 0}
          >
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Upload {Object.keys(pending).length || ""} matched
          </Button>
        </div>
        <Input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          // @ts-expect-error non-standard but widely supported
          webkitdirectory=""
          directory=""
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-xs text-muted-foreground">
          Tip: selecting the top-level <code>assets</code> or{" "}
          <code>assets/images</code> folder auto-maps every file by its relative
          path.
        </p>
      </Card>

      {unmatched.length > 0 && (
        <Card className="p-4 space-y-2 border-amber-500/50">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            {unmatched.length} unmatched file{unmatched.length === 1 ? "" : "s"} — assign manually
          </div>
          <div className="space-y-2">
            {unmatched.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="text-sm flex-1 truncate">{f.name}</div>
                <Select onValueChange={(v) => assignUnmatched(i, v)}>
                  <SelectTrigger className="w-72">
                    <SelectValue placeholder="Assign to path…" />
                  </SelectTrigger>
                  <SelectContent>
                    {remainingPaths.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUnmatched(unmatched.filter((_, x) => x !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {uploadedQ.isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEGACY_IMAGE_PATHS.map((p) => {
                const isUploaded = uploaded.has(p);
                const isPending = p in pending;
                return (
                  <TableRow key={p}>
                    <TableCell>
                      {isUploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : isPending ? (
                        <Upload className="h-4 w-4 text-blue-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      assets/images/{p}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isPending
                        ? `Ready: ${pending[p].name}`
                        : isUploaded
                          ? "Uploaded"
                          : "Missing"}
                    </TableCell>
                    <TableCell className="text-right">
                      {isPending && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearPending(p)}
                        >
                          Clear
                        </Button>
                      )}
                      {isUploaded && (
                        <>
                          <Button asChild size="sm" variant="ghost">
                            <a
                              href={`/assets/images/${p}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteOne(p)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
