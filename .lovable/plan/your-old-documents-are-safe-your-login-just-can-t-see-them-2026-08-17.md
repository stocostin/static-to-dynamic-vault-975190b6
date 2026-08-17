# Your old documents are safe — your login just can't see them

All 26 documents you created are still in the database (quotations for Madam Pauline, Mr. Kali, Miranje, Japeth, Michael Solid Doors, and more, from mid-July onwards). Nothing was lost.

The reason the Documents list looks empty is permissions: documents are only visible to accounts marked as admin/editor. The account `cicimachaa@gmail.com` currently has no role assigned, so every document row is filtered out for it. The other account, `muistone475@gmail.com`, does have the admin role and can see them.

## Fix

Grant the admin role to `cicimachaa@gmail.com` so that login sees and can edit all documents.

## Technical detail

- `business_documents` read/write policies all require `private.can_edit(auth.uid())`, which checks `public.user_roles`.
- `user_roles` has one row: `muistone475@gmail.com` → `admin`. No row exists for `cicimachaa@gmail.com` (id `287afda6-3a62-48ce-ad8a-e455ef7f23cc`).
- Migration: insert an `admin` role row for that user id (idempotent, `on conflict do nothing`).

No code changes are needed — after the role is granted, refresh `/admin/documents` and all 26 documents appear.
