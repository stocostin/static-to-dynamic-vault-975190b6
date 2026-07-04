import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Shachavir Timber CMS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminShell,
});
