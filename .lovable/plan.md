# Add cicimachaa@gmail.com as admin

## What happens

1. Temporarily turn on auto-confirm for email signups so no confirmation email is sent.
2. Create the account with the email and password you provided (signed up via the app's auth flow, immediately confirmed).
3. Grant that account the `admin` role in the roles table.
4. Turn auto-confirm back off so future public signups still require email confirmation.
5. Verify the role landed and that the account can reach the admin-only areas.

## Security note

The password was shared in chat, so treat it as exposed — please sign in and change it after setup.

## Technical details

- `supabase--configure_auth` with `auto_confirm_email: true` (signups enabled, no anonymous users), then revert to `auto_confirm_email: false` after the user exists.
- Account creation through the standard sign-up path; then insert into `public.user_roles (user_id, role)` with `role = 'admin'` (enum `public.app_role`), idempotent on the existing `(user_id, role)` unique constraint.
- No application code changes; the existing `private.has_role` / `is_admin_or_editor` checks already gate admin access.
