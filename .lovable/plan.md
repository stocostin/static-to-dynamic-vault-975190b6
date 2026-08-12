# Fix shachavirtimber.com DNS so the website displays

## What the screenshots confirm

- The root `shachavirtimber.com` A record has `185.158.133.1` entered, but **Save Record** is still showing, so that edit has not yet been saved.
- No `www.shachavirtimber.com` A record appears in the complete A-record list.
- Lovable verification text was accidentally copied onto unrelated names such as the root domain, `_dmarc`, `_acme-challenge`, `default._domainkey`, and cPanel service names.
- cPanel service names such as `webmail`, `autoconfig`, `cpanel`, and `whm` were also pointed to Lovable's website IP. Those are not website-domain records and may break cPanel or email services.

## Actions in cPanel

1. On the open root A-record edit, click **Save Record**.
   - Name: `shachavirtimber.com.`
   - Type: `A`
   - Record: `185.158.133.1`

2. Add a separate record for `www`:
   - Name: `www` (or `www.shachavirtimber.com.` if cPanel requires the full name)
   - Type: `A`
   - Record: `185.158.133.1`

3. Keep only the two actual Lovable verification records shown by Lovable's Domains setup:
   - `_lovable.shachavirtimber.com`
   - `_lovable.www.shachavirtimber.com`
   Remove the duplicate `_lovable.www` row if both copies have the same value.

4. Remove `lovable_verify=...` from every unrelated TXT record, including:
   - `shachavirtimber.com`
   - `_dmarc`
   - `_acme-challenge`
   - `default._domainkey`
   - `_carddav._tcp`
   - `_cpanel-dcv-test-record`
   Do not delete legitimate SPF, DKIM, DMARC, or email values if those records contain anything besides the accidental Lovable value.

5. Do not point `autoconfig`, `autodiscover`, `webmail`, `cpanel`, `whm`, `webdisk`, `cpcontacts`, or `cpcalendars` at `185.158.133.1`. Restore their original hosting-server values from your hosting provider if you still use cPanel/email, or ask the provider to restore the default service records.

## Verify after saving

- In Lovable, open **Project Settings → Project → Domains** and confirm both `shachavirtimber.com` and `www.shachavirtimber.com` are added. Resume **Complete Setup** if either is not Active.
- Allow up to 4 hours for the shown `14400`-second TTL, then test in a private window or on mobile data.
- Clear local DNS or temporarily use `1.1.1.1` if the old cPanel “Index of /” page remains cached.

No website-code or redirect HTML change is required; this is a DNS-record cleanup.
