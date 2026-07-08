## Problem

The PDF renderer already defaults to `DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES`, but the initial DB seed stored the old value `SAWN TIMBER | TREATED TIMBER | PLYWOOD | HARDWARE | DELIVERY` in `site_settings.document_footer_tagline`. Because that setting is non-empty, the PDF (header sub-tagline + footer band) uses the stale value instead of the new default.

Also the brand block in `DocumentEditor.tsx` passes `website_url: window.location.host` (the app host), not the real site URL from settings, so the branded footer contact bar shows the admin/preview host.

## Changes

1. New migration `supabase/migrations/<timestamp>_update_document_tagline.sql` that overwrites the stale tagline:
   ```sql
   UPDATE public.site_settings
   SET value = to_jsonb('DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES'::text)
   WHERE key = 'document_footer_tagline'
     AND value = to_jsonb('SAWN TIMBER | TREATED TIMBER | PLYWOOD | HARDWARE | DELIVERY'::text);
   ```
   (Guarded so a user-edited value is preserved.)

2. `src/components/admin/DocumentEditor.tsx` — build `brandSettings.website_url` from `readSetting(s, "contact_website")` / `site_url` if present, falling back to `window.location.host`, so the branded footer shows the public site, not the admin host.

3. `src/routes/_authenticated/admin.settings.tsx` — add a `help` note under `document_footer_tagline` pointing to the new default so future edits are obvious.

No changes to `renderDocument.ts` (default is already correct).

## Verification

- Run the migration, reload admin → Settings → Documents: tagline field shows the new value.
- Download an Invoice / Quotation / Receipt / Estimate PDF: header sub-tagline and footer band both read `DOORS & WINDOWS | FRAMES | STAIRCASE | FURNITURES`, logo + site name + contact bar render.
